var baseurl = "https://thoughtagent.azurewebsites.net";
if (process.env.NODE_ENV !== 'production') {
	baseurl = "http://localhost:3000";
}

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
	getJournalEntriesAsync: getJournalEntriesAsync
};

function getSuggestionDetails(link) {
	var parsed = url.parse(link);
	var source = parsed.hostname;
	if (source.indexOf("www.") === 0) {
		source = source.slice(4);
	}
	return {
		title: "Lorem ipsum sit dolor amet",
		link: link,
		source: source,
		website: parsed.protocol + "//" + parsed.host + "/"
	};
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

function getJournalEntriesAsync(user, callback) {
	var now = new Date();
	
	responses.rows({
		start: 1
	}, function(err, res) {
		if (err) {
			console.log(err);
			return;
		}

		var entries = [];
		for (var i = 0; i < res.length; i++) {
			var entry = res[i];

			if (user.identities.indexOf(entry.emailaddress) < 0) {
				continue;
			}

			var suggestions = [];
			if (typeof entry.foodforthought1 === "string")
				suggestions.push(getSuggestionDetails(entry.foodforthought1));
			if (typeof entry.foodforthought2 === "string")
				suggestions.push(getSuggestionDetails(entry.foodforthought2));
			if (typeof entry.foodforthought3 === "string")
				suggestions.push(getSuggestionDetails(entry.foodforthought3));
			if (typeof entry.foodforthought4 === "string")
				suggestions.push(getSuggestionDetails(entry.foodforthought4));
			if (typeof entry.foodforthought5 === "string")
				suggestions.push(getSuggestionDetails(entry.foodforthought5));

			entries.unshift({
				emailaddress: entry.emailaddress,
				datetime: getDateTime(now, entry.timestamp),
				text: entry.whatsonyourmind,
				suggestions: suggestions
			});
		}

		console.log(entries);
		callback(entries);
	});
}
