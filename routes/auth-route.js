const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const User = require('../models/user-model');

const UserRepository = require('../repositories/user-repository');

const AuthenticationService = require('../services/authentication-service');

router.path = '/auth';

function create_token_key(user) {
    return jwt.sign({
        user: user
    }, keys.token_key.secret, {
            expiresIn: 7 * 24 * 60 * 60 // 7 gün
        }
    );
}

function redirect_to_website(req, res) {

    success_type = req.user.success_type;

    req.user.success_type = undefined;

    res.redirect(keys.website_url + 'auth/loggedin/' + create_token_key(req.user) +
        '?return_url=' + (req.session.return_url ? req.session.return_url : '') +
        '&success_type=' + success_type);
}

// login
router.post('/login', (req, res) => {
    let user = {
        username_or_email: req.body.username_or_email,
        password: req.body.password
    };

    UserRepository.login(user, (error, result) => {
        if (error) return res.json({ success: false, error: error })
        else return res.json({ success: result.success, user: result.user, token_key: create_token_key(result.user) });
    });
});

// register
router.post('/register', (req, res) => {
    let user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
    });

    UserRepository.register(user, (error, result) => {
        if (error) return res.json({ success: false, error: error })
        else return res.json(result);
    });
});

// verify token key
router.get('/verify_token_key', passport.authenticate('jwt', { session: false }), (req, res) => {
        UserRepository.check_token_key(req.get('Authorization'), (error, decoded) => {
            // if token key is invalid
            if (error) res.json({ success: false, error: { msg: err.msg, code: 4001 } });
            // if token key is valid
            else res.json({ success: true });
        });
    }
);

// check permission access control
router.post('/check_permission', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        let requested_url = req.body.requested_url;
        if (requested_url) {
            AuthenticationService.check_permission(req.user.role, requested_url).then(result => {
                res.json({ success: result.success });
            });
        } else {
            res.json({ success: false });
        }
    }
);

// decode token key of Authorization header
router.get('/decode_token_key', passport.authenticate('jwt', { session: false }), (req, res) => {
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
    passport.authenticate('facebook', { scope: ['user_location', 'user_gender', 'user_link'] })
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
