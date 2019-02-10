const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

function create_token_key(req) {
    return jwt.sign({
        user: req.user
    }, keys.token.secret, {
            expiresIn: 7 * 24 * 60 * 60 // 7 gün
        }
    );
}

function redirect_to_website(req, res) {
    res.redirect('http://localhost:4200/auth/loggedin/' + create_token_key(req) + '?return_url=' + (req.session.return_url ? req.session.return_url : ''));
}

module.exports = (app) => {

    // google
    app.get(
        '/auth/google',
        (req, res, next) => {
            req.session.return_url = req.query.return_url;
            next();
        },
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })
    );

    app.get(
        '/auth/google/callback',
        passport.authenticate('google'),
        (req, res) => {

            // redirect to website
            redirect_to_website(req, res);
        }
    );

    // facebook
    app.get(
        '/auth/facebook',
        (req, res, next) => {
            req.session.return_url = req.query.return_url;
            next();
        },
        passport.authenticate('facebook', { scope: ['user_location', 'user_gender', 'user_link', 'user_friends', 'user_posts'] })
    );

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook'),
        (req, res) => {

            // redirect to website
            redirect_to_website(req, res);
        }
    );

    // steam
    app.get(
        '/auth/steam',
        (req, res, next) => {
            req.session.return_url = req.query.return_url;
            next();
        },
        passport.authenticate('steam'),
        function (req, res) {
            // The request will be redirected to Steam for authentication, so
            // this function will not be called.
        });

    app.get('/auth/steam/callback',
        passport.authenticate('steam', { failureRedirect: '/login', session: false }),
        (req, res) => {

            // redirect to website
            redirect_to_website(req, res);
        });
}
