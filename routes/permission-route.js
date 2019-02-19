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
router.get('/check_permission', passport.authenticate('jwt', { session: false }),
    (req, res) => {
        //let requested_urls = [req.protocol + '://' + req.hostname + req.originalUrl.split('?')[0]];
        // if (req.query.requested_url) requested_urls.push(req.query.requested_url);
        // console.log(requested_urls);

        let requested_url = req.query.requested_url;

        if (requested_url) {
            PermissionRepository.check_permission(req.user.role, requested_url, (error, res) => {
                // TODO: edit error area
                if (error) res.json({ success: false, error: { msg: err.msg, code: 1 } });

                else res.json({ success: true });
            });
        } else {
            // TODO: there is no requested_url ??? cant be fire this method
        }

        
    }
);

module.exports = router;
