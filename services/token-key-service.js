const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

function create_token_key(params) {
    return jwt.sign(
        params,
        keys.token_key.secret,
        { expiresIn: 30 * 24 * 60 * 60 /* 30 gün */ }
    );
}

function verify_token_key(token_key, secret_key, callback) {
    jwt.verify(token_key, secret_key, (err, decoded) => {
        if (err || !decoded) return callback({ success: false });
        else return callback({ success: true });
    });
}

module.exports = {
    create_token_key: create_token_key,
    verify_token_key: verify_token_key
}
