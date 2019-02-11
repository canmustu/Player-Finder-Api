const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

const salt = "0cd1e9E3d1bD079a"; // secret salt for encrypt password

// user schema
const UserSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: false
    },
    email: {
        type: String,
        unique: true,
        required: false
    },
    username: {
        type: String,
        unique: true,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    status: {
        type: Number,
        default: 1
    },
    gender: {
        type: Boolean,
        default: 1
    },
    avatar: {
        type: String,
        required: false,
    },
    karma_point: {
        type: Number,
        required: false,
        default: 0
    },
    last_seen: {
        type: Date,
        required: false,
    },
    scope: [{
        type: String,
        required: false
    }],
    "friend_requests": [
        {
            user: {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                },
                username: {
                    type: Date,
                    required: false,
                }
            },
            requested_at: {
                type: Date,
                required: false,
            }
        }
    ],
    google: {
        id: {
            type: String,
            unique: true,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    facebook: {
        id: {
            type: String,
            unique: true,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    steam: {
        id: {
            type: String,
            unique: true,
            required: false
        },
        url: {
            type: String,
            required: false
        },
        nick: {
            type: String,
            required: false
        },
        avatar: {
            type: String,
            required: false
        }
    },

}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

const User = module.exports = mongoose.model('users', UserSchema);

module.exports.getUserById = function (id, callback) {
    const query = { _id: id };
    User.findOne(query, callback);
}

module.exports.register = function (user, callback) {
    // check if email exists
    User.countDocuments({ email: user.email }, (error_email, email_count) => {
        // if error
        if (error_email) callback({ error: { msg: error_email, code: 1001 } }, null);
        // if email exists
        if (email_count == 0) {
            // check if username exists
            User.countDocuments({ username: user.username }, (error_username, username_count) => {
                // if error
                if (error_username) callback({ error: { msg: error_username, code: 1001 } }, null);
                // if username exists
                if (username_count == 0) {
                    try {
                        // encrypt the following password
                        user.password = encryptedPasswordAsFull(user.password)
                        // insert to db
                        user.save();
                        // hidden password for return
                        user.password = undefined;

                        return callback(null, { success: true, user });
                    } catch (error) {
                        return callback({ msg: error, code: 1001 }, null);
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

module.exports.forgetPassword = function (email, callback) {
    const new_password = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });

    User.updateOne(
        { email: email },
        { password: getHash(new_password + salt) },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'finansalbt1@gmail.com',
                        pass: 'finansal123'
                    }
                });

                var mailOptions = {
                    from: '👥 Finansal BT Mailer 👥 <finansalbt1@gmail.com>',
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

module.exports.changePassword = function (user_id, old_password, new_password, callback) {
    User.updateOne(
        { _id: user_id, password: getHash(old_password + salt) },
        { password: getHash(new_password + salt) },
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

module.exports.comparePassword = function (password, hash, callback) {
    if (hash == getHash(password + salt))
        return callback(null, true);
    else
        return callback(null, false);
}

getHash = function (str, alg = 'sha256') {
    let hash = crypto.createHash(alg);
    hash.update(str);
    return hash.digest('hex');
}

encryptedPasswordAsFull = function (password) {
    for (let i = 0; i < 10; i++) {
        password = getHash(password + salt)
    }
    return password;
}

encryptedPasswordAsHalf = function (password) {
    for (let i = 0; i < 5; i++) {
        password = getHash(password + salt)
    }
    return password;
}
