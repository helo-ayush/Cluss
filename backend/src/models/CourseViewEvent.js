const mongoose = require('mongoose');

const courseViewEventSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublishedCourse',
        required: true,
        index: true
    },
    creatorClerkId: {
        type: String,
        required: true,
        index: true
    },
    viewerClerkId: {
        type: String,
        default: '',
        index: true
    }
}, { timestamps: true });

courseViewEventSchema.index({ creatorClerkId: 1, createdAt: -1 });

module.exports = mongoose.model('CourseViewEvent', courseViewEventSchema);
