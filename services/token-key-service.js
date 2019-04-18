const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

function create_token_key(params) {
    return jwt.sign(
        params,
        keys.token_key.secret,
        { expiresIn: 30 * 24 * 60 * 60 /* 30 gün */ }
    );
}

function verify_token_key(token_key, callback) {
    jwt.verify(token_key, keys.token_key.secret, (error, decoded) => {
        if (error || !decoded) return callback({ success: false });
        else return callback({ success: true, user: decoded.user });
    });
}

module.exports = {
    create_token_key: create_token_key,
    verify_token_key: verify_token_key
}
