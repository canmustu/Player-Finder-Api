const Log = require('../models/log-model');
const LogRepository = require('../repositories/log-repository');

module.exports = (req, res, next) => {
    create_log(req);
    next();
}