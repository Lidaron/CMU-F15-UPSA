var users = [{
	identities: [ "***REMOVED***", "***REMOVED***" ],
	displayName: "Brian Xu",
	role: "admin",
}, {
	identities: [ "***REMOVED***" ],
	displayName: "Brian Nelson",
	role: "admin",
}, {
	identities: [ "***REMOVED***" ],
	displayName: "Paul Goodwin",
	role: "admin",
}, {
	identities: [ '***REMOVED***','***REMOVED***' ],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}, { 
	identities: ['***REMOVED***', '***REMOVED***'],
	displayName: "***REMOVED***",
	role: "user",
}];

var baseurl = "https://thoughtagent.azurewebsites.net";
if (process.env.NODE_ENV !== 'production') {
	baseurl = "http://localhost:3000";
}

// login
var passport = require('passport');
var Google_ClientID = '***REMOVED***';
var Google_ClientSecret = '***REMOVED***';
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

/* Users
-------------------------------------------------- */
module.exports = Users;

function Users(app) {
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
		callbackURL: baseurl + "/auth/google/callback"
	}, function (token, tokenSecret, profile, done) {
		var email = getAccountEmail(profile.emails);
		var user = {
			id: profile.id,
			email: email,
			name: profile.name,
			displayName: profile.displayName,
			picture: "",
			identities: [ email ],
			role: "user"
		};
		if (profile.photos.length > 0) {
			user.picture = profile.photos[0].value;
		}

		for (var i = 0; i < users.length; i++) {
			if (users[i].identities.indexOf(email) < 0) continue;
			user.identities = users[i].identities;
			user.role = users[i].role;
			break;
		}
		console.log(user);
		return done(null, user);
	})); 
	
	app.get('/auth/google', passport.authenticate('google', {
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/plus.login']
	}));
	app.get('/auth/google/callback', function(req, res, next) {
		passport.authenticate('google', function (err, user, info) {
			var redirectUrl = '/';
	
			if (err) { return next(err); }
			if (!user) { return res.redirect('/'); }
	
			if (req.session.redirectUrl) {
				redirectUrl = req.session.redirectUrl;
				req.session.redirectUrl = null;
			}

			req.logIn(user, function(err){
				if (err) { return next(err); }
			});
			res.redirect(redirectUrl);
		})(req, res, next);
	});
}

function getAccountEmail(emails) {
	for (var i = 0; i < emails.length; i++) {
		if (emails[i].type !== "account") continue;
		return emails[i].value;
	}
	return null;
}
