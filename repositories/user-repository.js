const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
const encryption = require('../utilization/encryption');

const User = require('../models/user-model');
const TokenKeyService = require('../services/token-key-service');

const salt_for_password = keys.encryption.salt_for_password;

// return an object for token key claims
set_user_for_token_key = function (user) {
    return {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        role: user.role
    };
}

get_user_by_id = function (id, callback) {
    let query = { _id: id };
    User.findOne(query, callback);
}

get_profile = function (user_id, callback) {
    // check if username exists
    User.findById(user_id, {
        "fullname": 1,
        "username": 1,
        "email": 1,
        "avatar": 1,
        "last_seen": 1,
        "karma_point": 1,
        "profile_visibility": 1
    }, (error, user) => {
        // if error
        if (error) return callback({ msg: error, code: '1001' }, null);
        // if user not exists
        else if (!user) {
            return callback({ msg: error, code: '2003' }, null);
        }
        
        // if profile is private
        // else if (!user.profile_visibility) {
        //     return callback({ msg: "Profile is private.", code: '2005' }, null);
        // }

        // if username exists
        else {
            return callback(null, { success: true, user: user });
        }
    })
}

register = function (user, callback) {
    // check if email exists
    User.countDocuments({ email: user.email }, (error_email, email_count) => {
        // if error
        if (error_email) return callback({ msg: error_email, code: '1001_1' }, null);
        // if email exists
        if (email_count == 0) {
            // check if username exists
            User.countDocuments({ username: user.username }, (error_username, username_count) => {
                // if error
                if (error_username) return callback({ msg: error_username, code: '1001_2' }, null);
                // if username exists
                if (username_count == 0) {
                    try {
                        // encrypt the following password
                        user.password = encyrpt_as_a_password(user.password);
                        // insert to db
                        user
                            .save()
                            .then(new_user => {
                                // register successful
                                return callback(null, {
                                    success: true,
                                    user: set_user_for_token_key(new_user),
                                    token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(new_user) })
                                });
                            });
                    } catch (error) {
                        return callback({ msg: error, code: '1001_3' }, null);
                    }
                } else {
                    // username already exists
                    return callback({ code: 2001 }, null);
                }
            })
        } else {
            // email already exists
            return callback({ code: 2002 }, null);
        }
    })
}

login = function (user, callback) {
    query = { $or: [{ username: user.username_or_email }, { email: user.username_or_email }] };

    // check if user exists
    User.findOne(query, (error, existing_user) => {
        // if error
        if (error) return callback( { msg: error, code: 1001 }, null);
        // if user exists
        if (existing_user) {
            // compare password
            if (compare_password(encyrpt_as_a_password(user.password), existing_user.password)) {
                // login successful
                return callback(null, {
                    success: true,
                    user: set_user_for_token_key(existing_user),
                    token_key: TokenKeyService.create_token_key({ user: set_user_for_token_key(existing_user) })
                });
            } else {
                // wrong password
                return callback({ code: 2004 }, null);
            }
        } else {
            // username not exists
            return callback({ code: 2003 }, null);
        }
    })
}

check_token_key = function (authorization_header, callback) {
    // Authorization header = "JWT {token_key}"
    // first 4 characters will be deleted and be taken token key to decode
    let token_key = authorization_header.substring(4);

    jwt.verify(token_key, keys.token_key.secret, (err, decoded) => {
        return callback(err, decoded);
    });
}

forget_password = function (email, callback) {
    const new_password = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });

    User.updateOne(
        { email: email },
        { password: get_hash(new_password + keys.encryption.salt_for_password) },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: '..@gmail.com',
                        pass: '..'
                    }
                });

                var mailOptions = {
                    from: '👥 .. 👥 <..@gmail.com>',
                    to: email,
                    subject: 'Şifremi Unuttum',
                    text: 'Yeni Şifreniz : ' + new_password
                };

                transporter.sendMail(mailOptions, function (err, result) {
                    if (err) {
                        return callback({ success: false, msg: err.msg }, null)
                    } else {
                        return callback(null, { success: true })
                    }
                });

            } else {
                return callback(null, {
                    success: false,
                    msg: 500
                })
            }
        }
    )
}

change_passsword = function (user_id, old_password, new_password, callback) {
    User.updateOne(
        { _id: user_id, password: get_hash(old_password + salt_for_password) },
        { password: get_hash(new_password + salt_for_password) },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, { success: false, msg: 700 })
            }
        }
    )
}

compare_password = function (password, hash) {
    if (password === hash)
        return true;
    else
        return false;
}

get_hash = function (str, alg = 'sha256') {
    let hash = crypto.createHash(alg);
    hash.update(str);
    return hash.digest('hex');
}

encrypt_text = function (text, times) {
    for (let i = 0; i < times; i++) {
        text = get_hash(text + salt_for_password)
    }
    return text;
}

encyrpt_as_a_password = function (text) {
    return encrypt_text(text, 10);
}

module.exports = {
    set_user_for_token_key: set_user_for_token_key,
    get_user_by_id: get_user_by_id,
    register: register,
    login: login,
    forget_password: forget_password,
    change_passsword: change_passsword,
    check_token_key: check_token_key,
    get_profile: get_profile
}
