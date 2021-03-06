const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const SteamStrategy = require('passport-steam').Strategy;
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const keys = require('../config/keys');
const mongoose = require('mongoose');

const User = require('../models/user-model');
const UserRepository = require('../repositories/user-repository');

passport.serializeUser(function (user, done) {
    console.log('serialize', user);
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('deserialize', user);
    done(null, user);
});

// jwt
let opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: keys.token_key.secret
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    UserRepository.get_user_by_id(jwt_payload.user.id, (err, user) => {
        if (err) {
            return done(err, false);
        }
        else if (user) {
            return done(null, UserRepository.set_user_for_token_key(user));
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

            // set returning_user for token key
            returning_user = UserRepository.set_user_for_token_key(existing_user);

            // return login info
            returning_user.success_type = "login";

            return done(null, returning_user);

        } else {

            User.findOne({ email: email.emails[0].value }, (error, found_user) => {
                if (error) return callback({ code: 1001 }, null);
                // email not exist , then register
                else if (!found_user) {
                    const user = new User({
                        fullname: email.displayName,
                        gender: email.gender == 'male' ? true : false,
                        email: email.emails[0].value,
                        avatar: email.photos[0].value,
                        "google.id": email.id
                    });
                    user.username = "ISIMSIZ_" + user._id;

                    // avatar of google size changed
                    user.avatar = user.avatar.replace("sz=50", "sz=200");

                    user
                        .save()
                        .then(new_user => {

                            // set returning_user for token key
                            returning_user = UserRepository.set_user_for_token_key(new_user);

                            // return register info
                            returning_user.success_type = "register";

                            return done(null, returning_user);
                        });
                }
                // email exists
                else {
                    return done({ code: 2002 }, null);
                }
            });


        }
    });
}));

// facebook
passport.use(new FacebookStrategy({
    clientID: keys.facebook.appID,
    clientSecret: keys.facebook.appSecret,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'gender', 'emails', 'profileUrl'],
}, (accessToken, refreshToken, profile, cb) => {
    User.findOne({ "facebook.id": profile.id }).then(existing_user => {

        let returning_user = {};

        // user exists
        if (existing_user) {

            // set returning_user for token key
            returning_user = UserRepository.set_user_for_token_key(existing_user);

            // return login info
            returning_user.success_type = "login";

            return cb(null, returning_user);
        }
        // check email to be registered
        else {
            User.findOne({ email: profile.emails[0].value }, (error, found_user) => {
                if (error) return callback({ code: 1001 }, null);
                // email not exist , then register
                else if (!found_user) {

                    const user = new User({
                        fullname: profile.displayName,
                        gender: profile.gender == 'male' ? true : false,
                        email: profile.emails[0].value,
                        avatar: "http://graph.facebook.com/" + profile.id + "/picture?type=large",
                        "facebook.id": profile.id,
                        "facebook.url": profile.profileUrl,
                    });

                    user.username = "ISIMSIZ_" + user._id;

                    user
                        .save()
                        .then(new_user => {

                            // set returning_user for token key
                            returning_user = UserRepository.set_user_for_token_key(new_user);

                            // return register info
                            returning_user.success_type = "register";

                            return cb(null, returning_user);
                        });
                }
                // email exists
                else {
                    return cb({ code: 2002 }, null);
                }
            });
        }
    });
}));

// steam
// passport.use(new SteamStrategy({
//     returnURL: 'http://localhost/auth/steam/callback',
//     realm: 'http://localhost/',
//     apiKey: keys.steam.apiKey
// }, (identifier, profile, done) => {
//     User.findOne({ "steam.id": profile.id }).then(existing_user => {
//         let returning_user = {};

//         if (existing_user) {

//             // set returning_user for token key
//             returning_user = UserRepository.set_user_for_token_key(existing_user);

//             return cb(null, returning_user);

//         } else {
//             const user = new User({
//                 "steam.nick": profile.displayName,
//                 "steam.id": profile.id,
//                 "steam.avatar": profile.photos[0].value,
//                 "steam.url": profile._json.profileurl
//             });

//             user
//                 .save()
//                 .then(new_user => {

//                     // set returning_user for token key
//                     returning_user = UserRepository.set_user_for_token_key(new_user);

//                     return done(null, returning_user);
//                 });
//         }
//     });
// }));


