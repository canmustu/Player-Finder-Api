const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

function create_token_key(params) {
    return jwt.sign(
        params,
        keys.token_key.secret,
        { expiresIn: 30 * 24 * 60 * 60 /* 30 gün */ }
    );
}

module.exports = {
    create_token_key: create_token_key
}
