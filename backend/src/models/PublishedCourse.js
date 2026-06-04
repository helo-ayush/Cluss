const mongoose = require('mongoose');

const publishedCourseSchema = new mongoose.Schema({
    sourcePrivateCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        index: true
    },
    creatorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    creatorClerkId: {
        type: String,
        required: true,
        index: true
    },
    creatorName: {
        type: String,
        default: 'Creator'
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    learningGoal: {
        type: String,
        default: ''
    },
    sourceQuery: {
        type: String,
        default: ''
    },
    modules: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    studyConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    tags: {
        type: [String],
        default: [],
        index: true
    },
    searchText: {
        type: String,
        default: '',
        index: true
    },
    searchEmbedding: {
        type: [Number],
        default: []
    },
    status: {
        type: String,
        enum: ['published', 'archived'],
        default: 'published',
        index: true
    },
    metrics: {
        views: { type: Number, default: 0 },
        readStarts: { type: Number, default: 0 },
        completions: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        bookmarks: { type: Number, default: 0 }
    },
    publishedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

publishedCourseSchema.index({ status: 1, publishedAt: -1 });
publishedCourseSchema.index({ status: 1, 'metrics.likes': -1, 'metrics.views': -1 });
publishedCourseSchema.index({ creatorClerkId: 1, status: 1, publishedAt: -1 });
publishedCourseSchema.index({ title: 'text', description: 'text', learningGoal: 'text', searchText: 'text', tags: 'text' });

module.exports = mongoose.model('PublishedCourse', publishedCourseSchema);
