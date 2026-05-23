const mongoose = require('mongoose');

const courseBookmarkSchema = new mongoose.Schema({
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

courseBookmarkSchema.index({ courseId: 1, clerkId: 1 }, { unique: true });

module.exports = mongoose.model('CourseBookmark', courseBookmarkSchema);
