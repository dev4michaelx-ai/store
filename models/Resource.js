const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    badge: { type: String, default: '' },
    price: { type: String, default: '$0.00' },
    image: { type: String, default: '' },
    youtube: { type: String, default: '' },
    images: { type: [String], default: [] },
    downloads: { type: String, default: '0' },
    rating: { type: String, default: '5.0' },
    time: { type: String, default: 'Just now' }
}, { timestamps: true, toJSON: { virtuals: true } });

module.exports = mongoose.model('Resource', resourceSchema);
