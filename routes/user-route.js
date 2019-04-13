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
    console.log(target_user_id);

    UserRepository.get_profile(target_user_id, (error, result) => {
        if (error) return res.json({ success: false, error: error });
        else {
            res.json({
                success: result.success,
                user: result.user
            });
        }
    });
});

// get profile - user_id user
router.get('/get_conversation/:user_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        // target user id from url
        let target_user_id = req.params.user_id;
        // source user id from token key
        let source_user_id = req.user.id;

        if(target_user_id && source_user_id) {

            UserRepository.get_conversation(target_user_id, source_user_id, (error, result) => {
                if (error) return res.json({ success: false, error: error });
                else {
                    res.json({
                        success: result.success,
                        conversation: result.conversation,
                    });
                }
            });

        }
    });
});

module.exports = router;
