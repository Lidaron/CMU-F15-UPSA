/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
	app = express();

var FormData = require('form-data');

// bootstrap application settings
require('./config/express')(app);

// config
var Google = require('./config/googleapis');
var Users = require('./config/users')(app);
var APIs = require('./config/apis')(app);

app.get('/', function(req, res){
	if (!req.user) {
		res.render('index');
		return;
	} else if (!req.user.role) {
		res.render('denied');
		return;
	}

	Google.getJournalEntriesAsync(req.user, function (entries) {
		res.render('listing', {
			user: req.user,
			entries: entries
		});
	});
});

app.get('/compose', function(req, res){
	if (!req.user || !req.user.role) {
		res.redirect('/');
		return;
	}

	res.render('composer', {
		user: req.user
	});
});

app.post('/compose', function(req, res) {
	if (!req.user || !req.user.role) {
		res.redirect('/');
		return;
	}
	
	var text = req.body.journal;
	if (!text) {
		res.render('composer', {
			user: req.user,
			draft: text
		});
	}

	var form = new FormData();
	form.append('entry.458172453', req.user.email);
	form.append('entry.1465035853', '');
	form.append('entry.1727190044', 'Development Web App');
	form.append('entry.1182892926', text);
	form.submit('https://docs.google.com/a/andrew.cmu.edu/forms/d/***REMOVED***/formResponse', function (err2, res2) {
		if (err2) {
			console.log(err2);
			return;
		}

		console.log(res2.statusCode);
		Google.updateCacheAsync(function () {
			res.redirect('/');
		});
	});
});

app.get('/forceupdate', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.render('denied');
		return;
	}
	Google.updateCacheAsync(function () {
		res.redirect('/');
	});
});

app.get('/wizards', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.redirect('/');
		return;
	}
	res.redirect('/wizards/concept-insights');
});

app.get('/wizards/concept-insights', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.redirect('/');
		return;
	}
	res.render('spell-conceptinsights', { user: req.user });
});

app.get('/wizards/concept-tagging', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.redirect('/');
		return;
	}
	res.render('spell-concepttagging', { user: req.user });
});

app.get('/wizards/keywords', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.redirect('/');
		return;
	}
	res.render('spell-keywords', { user: req.user });
});

app.get('/wizards/taxonomy', ensureAuthenticated, function(req, res){
	if (!req.user.role || req.user.role !== "admin") {
		res.redirect('/');
		return;
	}
	res.render('spell-taxonomy', { user: req.user });
});

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/login-error', function (req, res) {
	if (!req.user) {
		res.redirect('/');
		return;
	}
	res.render('login-error');
});

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


// error-handler settings
require('./config/error-handler')(app);

var port = process.env.port || 3000;
app.listen(port);
console.log('listening at:', port);
