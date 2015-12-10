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

var GoogleSpreadsheet = require('google-spreadsheet');
var sheet = new GoogleSpreadsheet("***REMOVED***");

var key = require('./googleapis-key.json');
var responsesIndex = 1;

sheet.useServiceAccountAuth(key, function(err) {
	if (err) return console.log(err);
	sheet.getInfo(function(err, sheet_info) {
		console.log( sheet_info.title + ' is loaded' );
	});
});


/* Google APIs
-------------------------------------------------- */
var AI;
module.exports = function (ThoughtAI) {
	AI = ThoughtAI;
	return {
		getJournalEntriesAsync: getJournalEntriesAsync,
		updateCacheAsync: updateCacheAsync
	};
}

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
		title: null,
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

function ensureProcessed(entry) {
	if (entry.conceptinsights !== "")
		return;
	if (entry.concepttagging !== "")
		return;
	if (entry.taxonomy !== "")
		return;
	if (entry.keywords !== "")
		return;

	var count = 0;
	var links = [];
	var updateCell = function (col) {
		return function (value, newlinks) {
			entry[col] = value;
			if (typeof newlinks === "object") links = links.concat(newlinks);
			if (++count < 4) return;
			if (links.length > 0) entry.foodforthought1 = links[0];
			if (links.length > 1) entry.foodforthought2 = links[1];
			if (links.length > 2) entry.foodforthought3 = links[2];
			if (links.length > 3) entry.foodforthought4 = links[3];
			if (links.length > 4) entry.foodforthought5 = links[4];
			console.log("Saving...");
			entry.save();
		};
	};

	try {
		AI.conceptInsightsText(
			entry.whatsonyourmind,
			updateCell("conceptinsights")
		);
	
		AI.alchemyConceptTaggingText(
			entry.whatsonyourmind,
			updateCell("concepttagging")
		);
	
		AI.alchemyTaxonomyText(
			entry.whatsonyourmind,
			updateCell("taxonomy")
		);
	
		AI.alchemyKeywordsText(
			entry.whatsonyourmind,
			updateCell("keywords")
		);
	} catch (e) {
		console.log(e);
	}
}

function updateCacheAsync(callback) {
	var now = new Date();

	sheet.getRows(responsesIndex, function(err, res) {
		if (err) {
			console.log(err);
			return;
		}

		cache = [];
		cacheTimestamp = now;

		for (var i = 0; i < res.length; i++) {
			var entry = res[i];

			if (entry.exclude !== "")
				continue;

			ensureProcessed(entry);

			var plates = [
				entry.foodforthought1,
				entry.foodforthought2,
				entry.foodforthought3,
				entry.foodforthought4,
				entry.foodforthought5
			];

			var suggestions = [];
			for (var j = 0; j < plates.length; j++) {
				if (plates[j] !== "") {
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
