const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
    subtopic_id: {
        type: mongoose.Schema.Types.Mixed
    },
    subtopic_title: {
        type: String
    },
    Youtube_query: {
        type: String
    },
    status: {
        type: String,
        enum: ['locked', 'active', 'completed'],
        default: 'locked'
    },
    // Video data (auto-populated by modulePreparer)
    videoId: { type: String, default: '' },
    videoTitle: { type: String, default: '' },
    channelTitle: { type: String, default: '' },
    transcript: { type: String, default: '' },
    // Quiz questions
    quiz: [{
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        hint: String
    }]
});

const moduleSchema = new mongoose.Schema({
    module_id: {
        type: mongoose.Schema.Types.Mixed
    },
    module_title: {
        type: String
    },
    prepStatus: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'failed'],
        default: 'pending'
    },
    quizReport: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    subtopics: [subtopicSchema]
});

const courseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course_query: {
        type: String,
        required: true
    },
    course_title: {
        type: String,
        required: true
    },
    current_module_index: {
        type: Number,
        default: 0
    },
    current_subtopic_index: {
        type: Number,
        default: 0
    },
    modules: [moduleSchema]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
