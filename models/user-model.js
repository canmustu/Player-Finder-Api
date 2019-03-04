const mongoose = require('mongoose');
const user_role_type_enum = require('../enums/user-role-type-enum');

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
    profile_visibility: {
        type: Boolean,
        default: true,
        required: true,
    },
    location: {
        country: {
            type: String,
            required: false,
        },
        city: {
            type: String,
            required: false,
        }
    },
    role: {
        type: String,
        required: true,
        default: user_role_type_enum.NORMAL_USER
    },
    "friends": [
        {
            user: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                username: {
                    type: String,
                    required: true,
                }
            },
            requested_at: {
                type: Date,
                required: true,
            }
        }
    ],
    "friend_requests": [
        {
            user: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                username: {
                    type: String,
                    required: true,
                }
            },
            requested_at: {
                type: Date,
                required: true,
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
