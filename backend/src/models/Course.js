const mongoose = require('mongoose');

// ══════════════════════════════════════════════════
//  AI-Generated Course Schemas (existing)
// ══════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════
//  Playlist Import Schemas (new)
// ══════════════════════════════════════════════════

const playlistVideoSchema = new mongoose.Schema({
    videoId:    { type: String, required: true },
    title:      { type: String, required: true },
    duration:   { type: Number, default: 0 },       // seconds
    channel:    { type: String, default: '' },
    channelId:  { type: String, default: '' },
    transcript: { type: String, default: '' },
    quiz: [{
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        hint: String
    }]
});

// ── Checkpoint submission record ──
const checkpointSubmissionSchema = new mongoose.Schema({
    attemptNumber:  { type: Number, required: true },
    theoryAnswers:  [String],
    codeFiles:      [{ fileName: String, content: String }],
    score:          { type: Number, default: 0 },
    feedback:       { type: mongoose.Schema.Types.Mixed, default: null },
    submittedAt:    { type: Date, default: Date.now }
});

// ── Daily checkpoint (assessment gate) ──
const checkpointSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['locked', 'available', 'passed', 'failed_all'],
        default: 'locked'
    },
    attemptsUsed:  { type: Number, default: 0 },
    maxAttempts:   { type: Number, default: 3 },   // overridden to 8 for Pro at runtime
    lastScore:     { type: Number, default: 0 },
    questionType: {
        type: String,
        enum: ['theory', 'coding', 'mixed'],
        default: 'theory'
    },
    // Theory questions (always present)
    theoryQuestions: [{
        question: String,
    }],
    // Coding question (only for coding/mixed types)
    codingQuestion: {
        prompt:           { type: String, default: '' },
        language:         { type: String, default: '' },
        expectedBehavior: { type: String, default: '' },
    },
    // Submission history
    submissions: [checkpointSubmissionSchema]
});

const daySchema = new mongoose.Schema({
    dayNumber:     { type: Number, required: true },
    videos:        [playlistVideoSchema],
    totalDuration: { type: Number, default: 0 },    // sum of video durations (seconds)
    isFiller:      { type: Boolean, default: false }, // true if injected by Topic Filler
    fillerTopic:   { type: String, default: '' },     // e.g. "TypeScript Basics"
    status: {
        type: String,
        enum: ['unprocessed', 'processing', 'ready', 'failed'],
        default: 'unprocessed'
    },
    checkpoint: {
        type: checkpointSchema,
        default: () => ({ status: 'locked' })
    }
});

// ══════════════════════════════════════════════════
//  Unified Course Schema
// ══════════════════════════════════════════════════

const courseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course_query: {
        type: String,
        default: ''
    },
    course_title: {
        type: String,
        required: true
    },

    // ── Source discriminator ──
    sourceType: {
        type: String,
        enum: ['ai-generated', 'playlist'],
        default: 'ai-generated'
    },

    // ── AI-Generated course fields ──
    current_module_index: {
        type: Number,
        default: 0
    },
    current_subtopic_index: {
        type: Number,
        default: 0
    },
    modules: [moduleSchema],

    // ── Playlist import fields ──
    sourcePlaylistId: { type: String, default: '' },
    learningGoal:     { type: String, default: '' },
    hoursPerDay:      { type: Number, default: 2 },
    currentDayIndex:  { type: Number, default: 0 },
    days:             [daySchema],

    // ── AI Analysis cache ──
    topicAnalysis: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
