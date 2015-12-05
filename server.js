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

// bootstrap application settings
require('./config/express')(app);

// bind API calls
var Google = require('./config/googleapis');
var APIs = require('./config/apis')(app);
var Users = require('./config/users')(app);

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
app.get('/wizards', ensureAuthenticated, function(req, res){
	if (!req.user.role) {
		res.redirect('/');
		return;
	}
	res.render('spellbook', { user: req.user });
});

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	console.log("Authentication needed");
	res.redirect('/auth/google');
}


// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
