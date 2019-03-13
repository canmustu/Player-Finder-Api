const crypto = require('crypto');
const keys = require('../config/keys');

const salt = keys.encryption.salt_for_password;

module.exports = {
    get_hash: function (str, alg = 'sha256') {
        let hash = crypto.createHash(alg);
        hash.update(str);
        return hash.digest('hex');
    },

    get_hash_with_salt: function(str) {
        get_hash(str + salt);
    },

    encrypt_text: function (text, times) {
        for (let i = 0; i < times; i++) {
            text = get_hash(text + salt_for_password)
        }
        return text;
    },

    encyrpt_as_a_password: function (text) {
        return encrypt_text(text, 10);
    }
}