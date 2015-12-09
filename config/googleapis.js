var baseurl = "https://thoughtagent.azurewebsites.net";
if (process.env.NODE_ENV !== 'production') {
	baseurl = "http://localhost:3000";
}

var request = require('request');
var cheerio = require('cheerio');

var ImageResolver = require('image-resolver/src/ImageResolver');
var resolver = new ImageResolver();
resolver.register(new ImageResolver.FileExtension());
resolver.register(new ImageResolver.MimeType());
resolver.register(new ImageResolver.Opengraph());
resolver.register(new ImageResolver.Webpage());

var url = require('url');
var dateFormat = require('dateformat');

var google = require('googleapis');
var GoogleSpreadsheets = require('google-spreadsheets');

var key = require('./googleapis-key.json');
var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/drive'], null);

var responses = null;
jwtClient.authorize(function (err, tokens) {
	if (err) {
		console.log(err);
		return;
	}
	
	var Google_ClientID = '***REMOVED***';
	var Google_ClientSecret = '***REMOVED***';
	var oauth2Client = new google.auth.OAuth2(Google_ClientID, Google_ClientSecret, baseurl + "/auth/google/callback"); 
	oauth2Client.setCredentials({
		access_token: tokens.access_token,
		refresh_token: tokens.refresh_token
	});

	GoogleSpreadsheets({
		key: "***REMOVED***",
		auth: oauth2Client
	}, function(err, spreadsheet) {
		if (err) {
			console.log(err);
			return;
		}

		responses = spreadsheet.worksheets[0];
	});

});


/* Google APIs
-------------------------------------------------- */
module.exports = {
	api: google,
	getJournalEntriesAsync: getJournalEntriesAsync,
	updateCacheAsync: updateCacheAsync
};

var links = {};

var cache = null;
var cacheTimestamp = new Date();

function getSuggestionDetails(link) {
	if (link in links) {
		return links[link];
	}

	var urlOpts = url.parse(link);
	var source = urlOpts.hostname;
	if (source.indexOf("www.") === 0) {
		source = source.slice(4);
	}

	links[link] = {
		title: "(Thought Bot is parsing this article...)",
		link: link,
		source: source,
		website: urlOpts.protocol + "//" + urlOpts.host + "/",
		image: ""
	};

	request(link, function (error, response, body) {
		links[link].title = "Article at " + source;
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);

			var $title = $("title");
			if ($title.length === 0) return;

			var title = $title.text();
			if (title === "") return;
			
			links[link].title = title;
		}
	});
	
	resolver.resolve(link, function(result){
		if (result) {
			links[link].image = result.image;
		}
	});
	
	return links[link];
}

function getDateTime(now, timestamp) {
	var then = new Date(timestamp);
	var date, time;

	if (now.getDate() == then.getDate()) {
		date = "Today";
	} else if (now.getDate() - 1 == then.getDate()) {
		date = "Yesterday";
	} else {
		date = dateFormat(then, "mmmm d");
	}

	time = dateFormat(then, "h:MM TT");

	return {
		timestamp: timestamp,
		date: date,
		time: time
	};
}

function filterJournalEntries(user) {
	var entries = [];
	for (var i = 0; i < cache.length; i++) {
		var entry = cache[i];
		if (user.identities.indexOf(entry.emailaddress) < 0)
			continue;
		entries[entries.length] = entry;
	}
	return entries;
}

function getJournalEntriesAsync(user, callback) {
	var now = new Date();

	if (cache !== null && cacheTimestamp.getTime() + 300000 >= now.getTime()) {
		var entries = filterJournalEntries(user);
		callback(entries);
		return;
	}

	updateCacheAsync(function () {
		var entries = filterJournalEntries(user);
		callback(entries);
	});
}

function updateCacheAsync(callback) {
	var now = new Date();

	responses.rows({
		start: 1
	}, function(err, res) {
		if (err) {
			console.log(err);
			return;
		}

		cache = [];
		cacheTimestamp = now;

		for (var i = 0; i < res.length; i++) {
			var entry = res[i];

			if (typeof entry.exclude === "string")
				continue;

			var plates = [
				entry.foodforthought1,
				entry.foodforthought2,
				entry.foodforthought3,
				entry.foodforthought4,
				entry.foodforthought5
			];

			var suggestions = [];
			for (var j = 0; j < plates.length; j++) {
				if (typeof plates[j] === "string") {
					suggestions.push(getSuggestionDetails(plates[j]));
				}
			}

			cache.unshift({
				emailaddress: entry.emailaddress,
				datetime: getDateTime(now, entry.timestamp),
				text: entry.whatsonyourmind,
				suggestions: suggestions
			});
		}

		console.log(cache);
		callback();
	});
}
