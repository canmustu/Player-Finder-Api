const mongoose = require('mongoose');

// user schema
const LobbySchema = mongoose.Schema({
    type: {
        type: Number,
        required: true,
        default: 1
    },
    owner: {
        id: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        avatar: {
            type: String,
            required: false
        },
    },
    members: [
        {
            user: {
                id: {
                    type: mongoose.Types.ObjectId,
                    required: true
                },
                username: {
                    type: String,
                    required: true
                },
                avatar: {
                    type: String,
                    required: false
                },
            }
        }
    ],
    member_limit: {
        type: Number,
        required: true
    },
    game: {
        id: {
            type: mongoose.Types.ObjectId
        },
        name: {
            type: String,
            required: true
        },
        short_name: {
            type: String,
            required: false
        },
        avatar: {
            type: String,
            required: false
        },
        rank: {
            name: {
                type: String,
                required: false
            },
            avatar: {
                type: String,
                required: false
            }
        }
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('lobbies', LobbySchema);
