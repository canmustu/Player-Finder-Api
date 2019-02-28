const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

const Log = require('../models/log-model');

create_log = (req) => {
    let log = new Log({
        ip: req.ip,
        url: req.url,
        method: req.method
    });
    log.save();
}

module.exports = {
    create_log: create_log
}
