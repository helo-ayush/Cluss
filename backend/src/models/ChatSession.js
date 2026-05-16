const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New chat'
    },
    linkedCourseId: {
        type: String,
        default: null
    },
    messages: {
        type: [chatMessageSchema],
        default: []
    }
}, { timestamps: true });

chatSessionSchema.index({ clerkId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
