var extend = require('util')._extend,
    async  = require('async');

/* Connect to services
-------------------------------------------------- */

// if bluemix credentials exists, then override local
var watson_credentials = extend({
	username: '***REMOVED***',
	password: '***REMOVED***',
	version: 'v2'
}); // VCAP_SERVICES

var akchemyapi_key = "***REMOVED***";

// AlchemyAPI
var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI(akchemyapi_key);

// Watson
var watson = require('watson-developer-cloud');
var conceptInsights = watson.concept_insights(watson_credentials);

var corpus_id = process.env.CORPUS_ID || '/corpora/public/TEDTalks';
var graph_id = process.env.GRAPH_ID || '/graphs/wikipedia/en-20120601';

/* Thought APIs
-------------------------------------------------- */
module.exports = ThoughtAPIs;

function ThoughtAPIs(app) {
	app.get('/api/labelSearch', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({ corpus: corpus_id, prefix: true, limit: 10, concepts: true }, req.query);
		conceptInsights.corpora.searchByLabel(params, function (err, results) {
			if (err) {
				return next(err);
			} else {
				res.json(results);
			}
		});
	});

	app.get('/api/conceptualSearch', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({ corpus: corpus_id, limit: 10 }, req.query);
		conceptInsights.corpora.getRelatedDocuments(params, function (err, data) {
			if (err) return next(err);
			async.parallel(data.results.map(getPassagesAsync), function (err, documentsWithPassages) {
				if (err) return next(err);
				data.results = documentsWithPassages;
				res.json(data);
			});
		});
	});

	app.post('/api/extractConceptMentions', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({ graph: graph_id }, req.body);
		conceptInsights.graphs.annotateText(params, function (err, results) {
			if (err) { return next(err); }
			res.json(results);
		});
	});

	app.post('/api/alchemyConceptTagging', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({}, req.body);
		alchemyapi.concepts('text', params.text, {}, function (output) {
			res.json(output);
		});
	});

	app.post('/api/alchemyKeywords', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({}, req.body);
		alchemyapi.keywords('text', params.text, {}, function (output) {
			res.json(output);
		});
	});

	app.post('/api/alchemyTaxonomy', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		var params = extend({}, req.body);
		alchemyapi.taxonomy('text', params.text, {}, function (output) {
			res.json(output);
		});
	});
}

/**
 * Builds an Async function that get a document and call crop the passages on it.
 * @param  {[type]} doc The document
 * @return {[type]}     The document with the passages
 */
var getPassagesAsync = function (doc) {
	return function (callback) {
		conceptInsights.corpora.getDocument(doc, function (err, fullDoc) {
			if (err) { callback(err); return; }
			doc = extend(doc, fullDoc);
			doc.explanation_tags.forEach(crop.bind(this, doc));
			delete doc.parts;
			callback(null, doc);
		});
	};
};

/**
 * Crop the document text where the tag is.
 * @param  {Object} doc The document.
 * @param  {Object} tag The explanation tag.
 */
var crop = function (doc, tag) {
	var textIndexes = tag.text_index;
	var documentText = doc.parts[tag.parts_index].data;

	var anchor = documentText.substring(textIndexes[0], textIndexes[1]);
	var left = Math.max(textIndexes[0] - 100, 0);
	var right = Math.min(textIndexes[1] + 100, documentText.length);

	var prefix = documentText.substring(left, textIndexes[0]);
	var suffix = documentText.substring(textIndexes[1], right);

	var firstSpace = prefix.indexOf(' ');
	if ((firstSpace !== -1) && (firstSpace + 1 < prefix.length))
		prefix = prefix.substring(firstSpace + 1);

	var lastSpace = suffix.lastIndexOf(' ');
	if (lastSpace !== -1)
		suffix = suffix.substring(0, lastSpace);

	tag.passage = '...' + prefix + '<b>' + anchor + '</b>' + suffix + '...';
};


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	console.log("Authentication needed");
	req.session.redirectUrl = req.url;
	res.redirect('/auth/google');
}
