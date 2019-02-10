const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

const salt = "0cd1e9e3d1bd079a"; // secret salt


// user schema
const UserSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    status: {
        type: Number,
        default: 0
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
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
            },
            username: {
                type: Date,
                required: false,
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
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('users', UserSchema);

module.exports.getUserByUsername = function (username, callback) {
    const query = { username: username }
    User.findOne(query, callback)
}

module.exports.add = async function (user) {

    const emailCount = await User.countDocuments({ email: user.email })
    if (emailCount > 0) throw new Error('301')

    const usernameCount = await User.countDocuments({ username: user.username })
    if (usernameCount > 0) throw new Error('302')

    user.password = getHash(user.password + salt)
    await user.save()
    user.password = undefined
    return { success: true, user: user }
}

module.exports.addCategoryToUser = function (user_id, category_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $addToSet: { categories: category_id } },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, {
                    success: false,
                    msg: 500
                })
            }
        }
    )
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

module.exports.deleteCategoryFromUser = function (user_id, category_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $pull: { categories: category_id } },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, { success: false, msg: 501 })
            }
        }
    )
}

module.exports.addTransactionToUser = function (user_id, transaction_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $addToSet: { transactions: transaction_id } },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, {
                    success: false,
                    msg: 901
                })
            }
        }
    )
}

module.exports.deleteTransactionFromUser = function (user_id, transaction_id, callback) {
    User.updateOne(
        { _id: user_id },
        { $pull: { transactions: transaction_id } },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, {
                    success: true
                })
            } else {
                return callback(null, { success: false, msg: 902 })
            }
        }
    )
}

module.exports.deleteTransactionsFromUser = function (user_id, array_of_transaction, callback) {
    User.updateOne(
        { _id: user_id },
        { $pullAll: { transactions: array_of_transaction } },
        (err, raw) => {
            if (err) return callback({ success: false, msg: err.msg }, null)
            if (!raw.ok) return callback({ success: false, msg: 700 }, null)
            if (raw.n == 0) {
                return callback(null, { success: false, msg: 300 })
            } else if (raw.nModified > 0) {
                return callback(null, { success: true })
            } else {
                return callback(null, { success: false, msg: 902 })
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
    if (hash == getHash(password + salt)) {
        return callback(null, true)
    }
    else return callback(null, false)
}

getHash = function (str, alg = 'sha256') {
    let hash = crypto.createHash(alg)
    hash.update(str)
    return hash.digest('hex')
}
