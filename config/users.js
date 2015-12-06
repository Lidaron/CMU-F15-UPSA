var users = {
	'blx': {
		identities: [ "***REMOVED***" ],
		displayName: "Brian Xu",
		role: "admin",
	},
	'bnelson': {
		identities: [ "***REMOVED***" ],
		displayName: "Brian Nelson",
		role: "admin",
	},
	'pgoodwin': {
		identities: [ "***REMOVED***" ],
		displayName: "Paul Goodwin",
		role: "admin",
	},
	'***REMOVED***': {
		identities: [ '***REMOVED***','***REMOVED***' ],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
	'***REMOVED***': { 
		identities: ['***REMOVED***', '***REMOVED***'],
		displayName: "***REMOVED***",
		role: "user",
	},
};

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
		var andrewId = getAndrewId(profile.emails);
		var user = {
			id: profile.id,
			andrewId: andrewId,
			email: andrewId + "@andrew.cmu.edu",
			name: profile.name,
			displayName: profile.displayName,
			picture: "",
			identities: [ andrewId + "@andrew.cmu.edu" ],
			role: null
		};
		if (profile.photos.length > 0) {
			user.picture = profile.photos[0].value;
		}
		if (andrewId && andrewId in users) {
			user.identities = users[andrewId].identities;
			user.role = users[andrewId].role;
			user.displayName = users[andrewId].displayName;
		}
		console.log(user);
		return done(null, user);
	})); 
	
	app.get('/auth/google', passport.authenticate('google', {
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/plus.login'],
		hd: "andrew.cmu.edu"
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
		})(req, res, next);;
	});
}

function getAndrewId(emails) {
	for (var i = 0; i < emails.length; i++) {
		if (emails[i].type !== "account") {
			continue;
		}
 
		var emailParts = emails[i].value.split("@");
		var username = emailParts[0];
		var domain = emailParts[1];

		if (domain === "andrew.cmu.edu") {
			return username;
		}
	}
}
