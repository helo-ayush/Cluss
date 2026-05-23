const mongoose = require('mongoose');

const creatorFollowSchema = new mongoose.Schema({
    followerClerkId: {
        type: String,
        required: true,
        index: true
    },
    creatorClerkId: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true });

creatorFollowSchema.index({ followerClerkId: 1, creatorClerkId: 1 }, { unique: true });
creatorFollowSchema.index({ creatorClerkId: 1, createdAt: -1 });

module.exports = mongoose.model('CreatorFollow', creatorFollowSchema);
