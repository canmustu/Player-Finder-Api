const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

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
    },

}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('users', UserSchema);
