const mongoose = require('mongoose');

const courseReadingProgressSchema = new mongoose.Schema({
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
    },
    moduleIndex: {
        type: Number,
        default: 0
    },
    subtopicIndex: {
        type: Number,
        default: 0
    },
    percent: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    lastReadAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

courseReadingProgressSchema.index({ courseId: 1, clerkId: 1 }, { unique: true });
courseReadingProgressSchema.index({ clerkId: 1, lastReadAt: -1 });

module.exports = mongoose.model('CourseReadingProgress', courseReadingProgressSchema);
