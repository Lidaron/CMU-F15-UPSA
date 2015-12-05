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

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
	clientID: Google_ClientID,
	clientSecret: Google_ClientSecret,
	callbackURL: "http://localhost:3000/auth/google/callback"
}, function (token, tokenSecret, profile, done) {
	console.log(profile);
	return done(null, profile);
})); 

app.get('/', function(req, res){ 
	res.render('index', { user: req.user }); 
}); 
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/plus.login'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
	res.redirect('/');
});
app.get('/wizards', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
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
