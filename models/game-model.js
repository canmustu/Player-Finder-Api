const mongoose = require('mongoose');

// user schema
const GameSchema = mongoose.Schema({
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
        required: true
    },
    ranks: [
        {
            name: {
                type: String,
                required: true
            },
            avatar: {
                type: String,
                required: true
            }
        }
    ],
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('games', GameSchema);
