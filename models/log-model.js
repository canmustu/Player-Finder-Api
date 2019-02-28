const mongoose = require('mongoose');

// user schema
const LogSchema = mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
    },
    method: {
        type: String,
        required: true,
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('logs', LogSchema);
