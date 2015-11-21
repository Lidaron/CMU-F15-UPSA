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
require('./apis')(app);

// login
var passport = require('passport');
var Google_ClientID = '***REMOVED***';
var Google_ClientSecret = '***REMOVED***';
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
	clientID: Google_ClientID,
	clientSecret: Google_ClientSecret,
	callbackURL: "https://localhost:3000/auth/google/callback"
}, function (token, tokenSecret, profile, done) {
	console.log(profile.id);
	/* User.findOrCreate({ googleId: profile.id }, function (err, user) {
		return done(err, user);
	});*/
}));
app.get('/auth/google', passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
	// Successful authentication, redirect home.
	res.redirect('/');
});
app.get('/wizards', passport.authenticate('google', { hd: 'andrew.cmu.edu', scope: 'https://www.googleapis.com/auth/plus.login' }));

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
