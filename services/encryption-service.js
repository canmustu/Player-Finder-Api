const crypto = require('crypto');
const keys = require('../config/keys');

const salt = keys.encryption.salt_for_password;

get_hash = function (str, alg = 'sha256') {
    let hash = crypto.createHash(alg);
    hash.update(str);
    return hash.digest('hex');
};

get_hash_with_salt = function (str) {
    get_hash(str + salt);
};

encrypt_text = function (str, times) {
    for (let i = 0; i < times; i++) {
        str = get_hash(str + salt)
    }
    return str;
};

encyrpt_as_a_password = function (str) {
    return encrypt_text(str, 10);
};

module.exports = {
    salt: salt,

    get_hash: get_hash,
    get_hash_with_salt: get_hash_with_salt,
    encrypt_text: encrypt_text,
    encyrpt_as_a_password: encyrpt_as_a_password
}