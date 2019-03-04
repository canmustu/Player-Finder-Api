const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const User = require('../models/user-model');
const UserRepository = require('../repositories/user-repository');

router.path = '/user'

// verify token key
router.post('/get_profile', passport.authenticate('jwt', { session: false }),
    (req, res) => {

        // target user id
        let target_user_id;
        // if user_id query exists
        if (req.body.user_id) target_user_id = req.body.user_id; // user from body
        else target_user_id = req.user.id; // user from token_key

        UserRepository.get_profile(target_user_id, (error, result) => {
            if (error) return res.json({ success: false, error: error })
            else {
                res.json({
                    success: result.success,
                    user: result.user,
                    "is_same_user": req.user.id == target_user_id
                });
            }
        });
    }
);

module.exports = router;
