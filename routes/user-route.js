const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const User = require('../models/user-model');
const UserRepository = require('../repositories/user-repository');

const AuthenticationService = require('../services/authentication-service');

router.path = '/user'

// get profile - authenticated user
router.get('/get_profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id
        let target_user_id;
        // if user_id query exists
        if (req.body.user_id) target_user_id = req.body.user_id; // user from body
        else target_user_id = req.user.id; // user from token_key

        UserRepository.get_profile(target_user_id, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else {
                res.json({
                    success: result.success,
                    user: result.user,
                    is_same_user: req.user.id == target_user_id
                });
            }
        });
    });
});

// get profile - user_id user
router.get('/get_profile/:user_id', (req, res) => {

    let target_user_id = req.params.user_id;

    UserRepository.get_profile(target_user_id, (error, result) => {
        if (error) return res.json({ success: false, error: error });
        else res.json(result);
    });
});

// get conversation - between 2 users
router.get('/get_conversation', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from url
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {
            UserRepository.get_conversation(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });
        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// add friend
router.post('/add_friend', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from body
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {

            UserRepository.add_friend(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// accept friend request
router.post('/accept_friend_request', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from body
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {

            UserRepository.accept_friend_request(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// cancel friend request by user who send request
router.post('/cancel_friend_request', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from body
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {

            UserRepository.cancel_friend_request(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// ignore friend request by user who received request
router.post('/ignore_friend_request', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from body
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {

            UserRepository.ignore_friend_request(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// get friends
router.post('/get_friends', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // user id from token key
        let user_id = req.user.id;

        if (user_id) {
            UserRepository.get_friends(user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// remove friend
router.post('/remove_friend', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from body
        let target_user_id = req.body.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if (target_user_id && source_user_id) {

            // remove target user from source's friends
            UserRepository.remove_friend(target_user_id, source_user_id, (error, result1) => {
                if (error) return res.json({ success: false, error: error });
                else {
                    // remove source user from target's friends
                    UserRepository.remove_friend(source_user_id, target_user_id, (error, result2) => {
                        if (error) return res.json({ success: false, error: error });
                        else res.json({ success: true });
                    });
                }
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// check if they are friends
router.post('/is_friend', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // source user id from token key
        let source_user_id = req.user.id;
        // target user id from body
        let target_user_id = req.body.user_id;

        if (target_user_id && source_user_id) {

            UserRepository.is_friend(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// get friend requests
router.post('/get_friend_requests', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // user id from token key
        let user_id = req.user.id;

        if (user_id) {
            UserRepository.get_friend_requests(user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        } else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// check if source user has target's friend request
router.post('/is_friend_request_received', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // source user id from token key
        let source_user_id = req.user.id;
        // target user id from body
        let target_user_id = req.body.user_id;

        if (target_user_id && source_user_id) {

            UserRepository.is_friend_request(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        }
        else
            return res.json({ success: false, error: { code: 2006 } });
    });
});

// check if target user has source's friend request
router.post('/is_friend_request_sent', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // source user id from token key
        let source_user_id = req.user.id;
        // target user id from body
        let target_user_id = req.body.user_id;

        if (target_user_id && source_user_id) {

            UserRepository.is_friend_request(source_user_id, target_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else res.json(result);
            });

        }
        else
            return res.json({ success: false, error: { code: 2006 } });
    });
});

module.exports = router;
