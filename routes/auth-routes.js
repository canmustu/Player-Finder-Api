const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const User = require('../models/user-model')

router.path = '/auth'

function create_token_key(req) {
    return jwt.sign({
        user: req.user
    }, keys.token_key.secret, {
            expiresIn: 7 * 24 * 60 * 60 // 7 gün
        }
    );
}

function redirect_to_website(req, res) {
    res.redirect(keys.website_url + 'auth/loggedin/' + create_token_key(req) + '?return_url=' + (req.session.return_url ? req.session.return_url : ''));
}

// login
router.post('/login', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    User.getUserByUsername(username, (err, user) => {
        if (err) throw err
        if (!user) {
            return res.json({ success: false, msg: 'User not found' })
        }

        User.comparePassword(password, user.password, (err, isMatch) => {

            if (err) throw err
            if (isMatch) {
                const token = jwt.sign({
                    user: {
                        _id: user._id,
                        fullname: user.fullname,
                        username: user.username,
                        email: user.email
                    }
                }, keys.token_key.secret, {
                        expiresIn: 7 * 24 * 60 * 60 // seconds
                    })

                res.json({
                    success: true,
                    token: 'JWT ' + token,
                    user: {
                        fullname: user.fullname,
                        username: user.username,
                        email: user.email
                    }
                })
            } else {
                return res.json({ success: false, msg: 'Wrong password' })
            }
        })
    })
});

// register
router.post('/register', (req, res) => {
    let user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        gender: req.body.gender
    });

    User.register(user, (error, result) => {
        if (error) return res.json({ success: false, error: error })
        else return res.json(result);
    });
});

// verify token key
router.get('/verify_token_key', passport.authenticate('jwt', { session: false }),
    function (req, res) {
        jwt.verify(req.get('Authorization').substring(4), keys.token_key.secret, (err, decoded) => {
            if (err) res.json({ success: false, err: err.msg });
            else res.json({ success: true });
        });
    }
);

// decode token key of Authorization header
router.get('/decode_token_key', passport.authenticate('jwt', { session: false }),
    function (req, res) {
        // Authorization header = "JWT {token_key}"
        // first 4 characters will be deleted and be taken token key to decode
        jwt.verify(req.get('Authorization').substring(4), keys.token_key.secret, (err, decoded) => {
            if (err) res.json({ success: false, err: err.msg });
            else res.json({ success: true, user: req.user });
        });
    }
);

// OAUTH 2 - START //

// google oauth 2 start
router.get(
    '/google',
    (req, res, next) => {
        req.session.return_url = req.query.return_url;
        next();
    },
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get(
    '/google/callback',
    passport.authenticate('google'),
    (req, res) => {

        // redirect to website
        redirect_to_website(req, res);
    }
);
// google oauth 2 end

// facebook oauth 2 start
router.get(
    '/facebook',
    (req, res, next) => {
        req.session.return_url = req.query.return_url;
        next();
    },
    passport.authenticate('facebook', { scope: ['user_location', 'user_gender', 'user_link', 'user_friends', 'user_posts'] })
);

router.get(
    '/facebook/callback',
    passport.authenticate('facebook'),
    (req, res) => {
        // redirect to website
        redirect_to_website(req, res);
    }
);
// facebook oauth 2 end

// steam oauth 2 start
router.get(
    '/steam',
    (req, res, next) => {
        req.session.return_url = req.query.return_url;
        next();
    },
    passport.authenticate('steam'),
    function (req, res) {
        // The request will be redirected to Steam for authentication, so
        // this function will not be called.
    }
);

router.get(
    '/steam/callback',
    passport.authenticate('steam', { session: false }),
    (req, res) => {

        // redirect to website
        redirect_to_website(req, res);
    }
);
// steam oauth 2 end

// OAUTH 2 - END //

module.exports = router;
