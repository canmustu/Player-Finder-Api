const mongoose = require('mongoose');
require('../enums/link-type-enum');

// user schema
const LinkSchema = mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: LinkTypes.WEBSITE_LINK
    }
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('permissions', PermissionSchema);
