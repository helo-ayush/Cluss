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
    aiChatUsage: {
        date: { type: String }, // "YYYY-MM-DD"
        count: { type: Number, default: 0 }
    },
    coursesCreated: {
        type: Number,
        default: 0
    },
    lastCourseCreatedAt: {
        type: Date,
        default: null
    },
    // Tracks daily topic unlocks per course for free tier limit
    topicUnlocks: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        date: { type: String },      // "YYYY-MM-DD"
        count: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
