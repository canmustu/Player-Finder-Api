const mongoose = require('mongoose');

// user schema
const PermissionSchema = mongoose.Schema({
    role: {
        type: String,
        required: false
    },
    sub_permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    }],
    url_permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    }]
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('permissions', PermissionSchema);
