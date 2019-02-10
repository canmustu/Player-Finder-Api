const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const SteamStrategy = require('passport-steam').Strategy;
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const keys = require('../config/keys');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const User = mongoose.model('users');

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// jwt
let opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: keys.token_key.secret
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {

    User.getUserById(jwt_payload.user.id, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                scope: user.scope.length > 0 ? user.scope : undefined
            });
        } else {
            return done(null, false);
        }
    });
}));

// google
passport.use(new GoogleStrategy({
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, email, done) => {
    User.findOne({ "google.id": email.id }).then(existing_user => {
        let returning_user = {};

        if (existing_user) {

            returning_user.id = existing_user.id;
            returning_user.fullname = existing_user.fullname;
            returning_user.email = existing_user.email;
            returning_user.username = existing_user.username;
            returning_user.scope = existing_user.scope.length > 0 ? existing_user.scope : undefined;

            return done(null, returning_user);

        } else {
            const new_user = new User({
                fullname: email.displayName,
                gender: email.gender == 'male' ? true : false,
                email: email.emails[0].value,
                avatar: email.photos[0].value,
                "google.id": email.id
            });

            new_user
                .save()
                .then(user => {

                    returning_user.id = user.id;
                    returning_user.fullname = user.fullname;
                    returning_user.email = user.email;

                    return done(null, returning_user);
                });
        }
    });
}));

// facebook
passport.use(new FacebookStrategy({
    clientID: keys.facebook.appID,
    clientSecret: keys.facebook.appSecret,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'gender', 'photos', 'emails', 'profileUrl'],
}, (accessToken, refreshToken, profile, cb) => {

    User.findOne({ "facebook.id": profile.id }).then(existing_user => {
        let returning_user = {};

        if (existing_user) {

            returning_user.id = existing_user.id;
            returning_user.fullname = existing_user.fullname;
            returning_user.email = existing_user.email;
            returning_user.username = existing_user.username;
            returning_user.scope = existing_user.scope.length > 0 ? existing_user.scope : undefined;

            return cb(null, returning_user);

        } else {
            const new_user = new User({
                fullname: profile.displayName,
                gender: profile.gender == 'male' ? true : false,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                "facebook.id": profile.id,
                "facebook.url": profile.profileUrl,
            });

            new_user
                .save()
                .then(user => {

                    returning_user.id = user.id;
                    returning_user.fullname = user.fullname;
                    returning_user.email = user.email;

                    return cb(null, returning_user);
                });
        }
    });
}));

// steam
passport.use(new SteamStrategy({
    returnURL: 'http://localhost/auth/steam/callback',
    realm: 'http://localhost/',
    apiKey: keys.steam.apiKey
}, (identifier, profile, done) => {

    User.findOne({ "steam.id": profile.id }).then(existing_user => {
        let returning_user = {};

        if (existing_user) {

            returning_user.id = existing_user.id;
            returning_user.fullname = existing_user.fullname;
            returning_user.email = existing_user.email;
            returning_user.username = existing_user.username;
            returning_user.scope = existing_user.scope.length > 0 ? existing_user.scope : undefined;

            return done(null, returning_user);

        } else {
            const new_user = new User({
                "steam.nick": profile.displayName,
                "steam.id": profile.id,
                "steam.avatar": profile.photos[0].value,
                "steam.url": profile._json.profileurl
            });

            new_user
                .save()
                .then(user => {

                    returning_user.id = user.id;
                    returning_user.fullname = user.fullname;
                    returning_user.email = user.email;

                    return done(null, returning_user);
                });
        }
    });
}
));