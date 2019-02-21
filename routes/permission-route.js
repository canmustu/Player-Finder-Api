const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const Permission = require('../models/permission-model');
const PermissionRepository = require('../repositories/permission-repository');

router.path = '/permission'

// verify token key
router.post('/check_permission', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        let requested_url = req.body.requested_url;
        if (requested_url) {
            PermissionRepository.check_permission(req.user.role, requested_url).then(result => {
                res.json({ success: result.success });
            });
        } else {
            res.json({ success: false });
        }
    }
);

module.exports = router;
