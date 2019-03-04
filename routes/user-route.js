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
        UserRepository.get_profile(req.user.id, (error, user) => {
            if (error) return res.json({ success: false, error: error })
            else res.json(user);
        });
    }
);

module.exports = router;
