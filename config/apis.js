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

var akchemyapi_key = "***REMOVED***"; // "***REMOVED***";

// AlchemyAPI
var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI(akchemyapi_key);

// Watson
// Use the IBM Watson NLU and Discovery SDKs + authenticators
var NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
var DiscoveryV2 = require('ibm-watson/discovery/v2');
var { IamAuthenticator } = require('ibm-watson/auth');
var { BasicAuthenticator } = require('ibm-cloud-sdk-core');

var nlu, discovery;
var serviceVersion = watson_credentials.version || '2021-08-01';

if (watson_credentials && watson_credentials.username && watson_credentials.password) {
	// legacy username/password credentials
	var basicAuth = new BasicAuthenticator({ username: watson_credentials.username, password: watson_credentials.password });
	nlu = new NaturalLanguageUnderstandingV1({
		version: serviceVersion,
		authenticator: basicAuth,
		serviceUrl: watson_credentials.url || process.env.NLU_URL
	});
	discovery = new DiscoveryV2({
		version: serviceVersion,
		authenticator: basicAuth,
		serviceUrl: process.env.DISCOVERY_URL || watson_credentials.url
	});
} else if (watson_credentials && (watson_credentials.iam_apikey || watson_credentials.apikey)) {
	// IAM apikey credentials
	var apikey = watson_credentials.iam_apikey || watson_credentials.apikey;
	var iamAuth = new IamAuthenticator({ apikey: apikey });
	nlu = new NaturalLanguageUnderstandingV1({
		version: serviceVersion,
		authenticator: iamAuth,
		serviceUrl: process.env.NLU_URL || watson_credentials.url
	});
	discovery = new DiscoveryV2({
		version: serviceVersion,
		authenticator: iamAuth,
		serviceUrl: process.env.DISCOVERY_URL || watson_credentials.url
	});
} else {
	// fallback: instantiate with only version; services may error at runtime if not configured
	nlu = new NaturalLanguageUnderstandingV1({ version: serviceVersion, serviceUrl: process.env.NLU_URL });
	discovery = new DiscoveryV2({ version: serviceVersion, serviceUrl: process.env.DISCOVERY_URL });
}

// Discovery project id (required for document search).
var discovery_project_id = process.env.DISCOVERY_PROJECT_ID || process.env.DISCOVERY_PROJECT || null;

var corpus_id = process.env.CORPUS_ID || '/corpora/public/TEDTalks';
var graph_id = process.env.GRAPH_ID || '/graphs/wikipedia/en-20120601';

/* Thought APIs
-------------------------------------------------- */
module.exports = function (app) {
	var APIs = new ThoughtAPIs(app);
	APIs.init();
	return APIs;
};

function ThoughtAPIs(app) {
	this.app = app;
}

ThoughtAPIs.prototype.labelSearch = function (query, resolve, reject) {
	var q = (query && (query.q || query.text || query.label)) || '';
	if (!discovery || !discovery_project_id) {
		var err = new Error('Discovery not configured. Set DISCOVERY_PROJECT_ID to enable labelSearch.');
		console.log('labelSearch', err);
		return reject(err);
	}
	var params = {
		projectId: discovery_project_id,
		naturalLanguageQuery: q,
		count: 10
	};
	discovery.query(params)
	.then(function(response){
		console.log('labelSearch', response.result);
		resolve(response.result);
	})
	.catch(function(err){
		console.log('labelSearch', err);
		reject(err);
	});
};

ThoughtAPIs.prototype.conceptualSearch = function (query, resolve, reject) {
	var q = (query && (query.q || query.text || query.label)) || '';
	if (!discovery || !discovery_project_id) {
		var err = new Error('Discovery not configured. Set DISCOVERY_PROJECT_ID to enable conceptualSearch.');
		console.log('conceptualSearch', err);
		return reject(err);
	}
	var params = {
		projectId: discovery_project_id,
		naturalLanguageQuery: q,
		count: 10,
		highlight: true
	};
	discovery.query(params)
	.then(function(response){
		// response.result contains matching_results and other info
		console.log('conceptualSearch', response.result);
		resolve(response.result);
	})
	.catch(function(err){
		console.log('conceptualSearch', err);
		reject(err);
	});
};

ThoughtAPIs.prototype.extractConceptMentions = function (query, resolve, reject) {
	var text = (query && query.text) || query;
	if (!text) {
		var err = new Error('No text provided to extractConceptMentions');
		console.log('extractConceptMentions', err);
		return reject(err);
	}
	var params = {
		text: text,
		features: {
			concepts: {},
			entities: {}
		}
	};
	nlu.analyze(params)
	.then(function(response){
		console.log('extractConceptMentions', response.result);
		resolve(response.result);
	})
	.catch(function(err){
		console.log('extractConceptMentions', err);
		reject(err);
	});
};

ThoughtAPIs.prototype.alchemyConceptTagging = function (text, resolve) {
	alchemyapi.concepts('text', text, {}, function (output) {
		console.log('alchemyConceptTagging', output);
		resolve(output);
	});
};

ThoughtAPIs.prototype.alchemyKeywords = function (text, resolve) {
	alchemyapi.keywords('text', text, {}, function (output) {
		console.log('alchemyKeywords', output);
		resolve(output);
	});
};

ThoughtAPIs.prototype.alchemyTaxonomy = function (text, resolve) {
	alchemyapi.taxonomy('text', text, {}, function (output) {
		console.log('alchemyTaxonomy', output);
		resolve(output);
	});
};

ThoughtAPIs.prototype.init = function () {
	var APIs = this;
	var app = this.app;

	app.get('/api/labelSearch', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.conceptualSearch(req.query, function (results) {
			res.json(results);
		}, function (err) {
			next(err);
		});
	});

	app.get('/api/conceptualSearch', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.conceptualSearch(req.query, function (results) {
			res.json(results);
		}, function (err) {
			next(err);
		});
	});

	app.post('/api/extractConceptMentions', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.extractConceptMentions(req.body, function (results) {
			res.json(results);
		}, function (err) {
			next(err);
		});
	});

	app.post('/api/alchemyConceptTagging', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.alchemyConceptTagging(req.body.text, function (output) {
			res.json(output);
		});
	});

	app.post('/api/alchemyKeywords', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.alchemyKeywords(req.body.text, function (output) {
			res.json(output);
		});
	});

	app.post('/api/alchemyTaxonomy', ensureAuthenticated, function (req, res, next) {
		if (!req.user.role || req.user.role !== "admin") {
			res.redirect('/');
			return;
		}

		APIs.alchemyTaxonomy(req.body.text, function (output) {
			res.json(output);
		});
	});
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
