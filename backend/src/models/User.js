const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    activeCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    avatar: {
        type: String,
        default: 'none'
    },
    trusted_creators: {
        type: [String],
        default: []
    },
    // ── SaaS Plan Fields ──
    plan: {
        type: String,
        enum: ['free', 'pro', 'ultra'],
        default: 'free'
    },
    // ── Unified Credit System ──
    credits: {
        balance: { type: Number, default: 0 },
        lastRefillDate: { type: Date, default: null },
        billingCycleEnd: { type: Date, default: null }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
