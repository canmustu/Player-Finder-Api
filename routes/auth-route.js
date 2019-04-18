const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const User = require('../models/user-model');
const UserRepository = require('../repositories/user-repository');
const AuthenticationService = require('../services/authentication-service');
const TokenKeyService = require('../services/token-key-service');

router.path = '/auth';

function redirect_to_website(req, res) {

    if (req.user) {
        let token_key = TokenKeyService.create_token_key({ user: req.user });
        let return_url = req.session.return_url ? req.session.return_url : '';
        let success_type = req.user.success_type;

        req.user.success_type = undefined;

        delete req.session.return_url;

        res.redirect(keys.website_url + 'auth/loggedin/' + token_key +
            '?return_url=' + return_url +
            '&success_type=' + success_type);
    }
    else {
        let error_string;

        if (req.error_code == "2002") {
            error_string = "Kayıt olmaya çalıştığınız email sistemde zaten mevcut.";
        }

        res.redirect(keys.website_url + 'error/error?description=' + error_string);
    }
}

// login
router.post('/login', (req, res) => {
    let user = {
        username_or_email: req.body.username_or_email,
        password: req.body.password
    };

    if (user.username_or_email && user.password) {
        UserRepository.login(user, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    }
    else {
        return res.json({ success: false, error: { code: 2006 } });
    }
});

// register
router.post('/register', (req, res) => {
    let user = new User({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
    });

    if (user.email && user.username && user.password) {
        UserRepository.register(user, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    }
    else {
        return res.json({ success: false, error: { code: 2006 } });
    }
});

// START MOBILE SPECIFIC ROUTES

// register or login , facebook oauth2 for MOBILE
router.post('/login_with_facebook', (req, res) => {

    let user = new User({
        email: req.body.email,
        fullname: req.body.fullname,
        facebook: {
            id: req.body.facebook_id
        }
    });

    if (user.email && user.facebook.id) {
        UserRepository.login_with_facebook(user, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    }
    else {
        return res.json({ success: false, error: { code: 2006 } });
    }
});

// register or login , google oauth2 for MOBILE
router.post('/login_with_google', (req, res) => {
    let user = new User({
        email: req.body.email,
        fullname: req.body.fullname,
        avatar: req.body.avatar,
        google: {
            id: req.body.google_id
        }
    });

    if (user.email && user.google.id) {
        UserRepository.login_with_google(user, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    }
    else {
        return res.json({ success: false, error: { code: 2006 } });
    }
});

// END MOBILE SPECIFIC ROUTES

// verify token key
router.get('/verify_token_key', passport.authenticate('jwt', { session: false }), (req, res) => {
    TokenKeyService.verify_token_key(req.get('Authorization').substring(4), (result) => {
        return res.json({ success: result.success });
    })
});

// check permission access control
router.post('/check_permission', passport.authenticate('jwt', { session: false }), (req, res) => {
    let requested_url = req.body.requested_url;
    if (requested_url) {
        AuthenticationService.check_permission(req.user.role, requested_url).then(result => {
            res.json({ success: result.success });
        });
    } else {
        res.json({ success: false });
    }
});

// decode token key of Authorization header
router.get('/decode_token_key', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Authorization header = "JWT {token_key}"
    // first 4 characters will be deleted and be taken token key to decode
    jwt.verify(req.get('Authorization').substring(4), keys.token_key.secret, (err, decoded) => {
        if (err) res.json({ success: false, err: err.msg });
        else res.json({ success: true, user: req.user });
    });
});

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
    (req, res) => {
        passport.authenticate('google', (error, user) => {

            if (error) req.error_code = error.code;
            req.user = user;

            // redirect to website
            redirect_to_website(req, res);
        })(req, res)
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
    (req, res) => {
        passport.authenticate('facebook', (error, user) => {

            if (error) req.error_code = error.code;
            req.user = user;

            // redirect to website
            redirect_to_website(req, res);
        })(req, res)
    }
);

// facebook oauth 2 end

// steam oauth 2 start
// router.get(
//     '/steam',
//     (req, res, next) => {
//         req.session.return_url = req.query.return_url;
//         next();
//     },
//     passport.authenticate('steam'),
//     function (req, res) {
//         // The request will be redirected to Steam for authentication, so
//         // this function will not be called.
//     }
// );

// router.get(
//     '/steam/callback',
//     passport.authenticate('steam', { session: false }),
//     (req, res) => {

//         // redirect to website
//         redirect_to_website(req, res);
//     }
// );
// steam oauth 2 end

// OAUTH 2 - END //

module.exports = router;
