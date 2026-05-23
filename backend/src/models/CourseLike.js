const mongoose = require('mongoose');

const courseLikeSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublishedCourse',
        required: true,
        index: true
    },
    clerkId: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true });

courseLikeSchema.index({ courseId: 1, clerkId: 1 }, { unique: true });

module.exports = mongoose.model('CourseLike', courseLikeSchema);
