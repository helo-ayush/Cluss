const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
    question: { type: String, default: '' },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    hint: { type: String, default: '' }
}, { _id: false });

const writtenQuestionSchema = new mongoose.Schema({
    question: { type: String, default: '' },
    rubric: { type: [String], default: [] }
}, { _id: false });

const codeTaskSchema = new mongoose.Schema({
    prompt: { type: String, default: '' },
    language: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    rubric: { type: [String], default: [] }
}, { _id: false });

const lessonCitationSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    url: { type: String, default: '' }
}, { _id: false });

const lessonBlockRevisionSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    code: { type: String, default: '' },
    language: { type: String, default: '' },
    callout: { type: String, default: '' },
    blockSummary: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
    action: { type: String, default: '' }
}, { _id: false });

const lessonBlockSchema = new mongoose.Schema({
    blockId: { type: String, default: '' },
    type: {
        type: String,
        enum: ['intro', 'concept', 'diagram', 'example', 'code', 'callout', 'summary', 'project', 'practice'],
        default: 'concept'
    },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    code: { type: String, default: '' },
    language: { type: String, default: '' },
    callout: { type: String, default: '' },
    blockSummary: { type: String, default: '' },
    inlineChallenge: {
        type: new mongoose.Schema({
            type: { type: String, enum: ['fill-in-the-blank', 'guess-output', 'mcq'], default: 'fill-in-the-blank' },
            question: { type: String, default: '' },
            codeTemplate: { type: String, default: '' },
            expectedAnswer: { type: String, default: '' },
            hint: { type: String, default: '' },
            options: { type: [String], default: [] },
            explanation: { type: String, default: '' }
        }, { _id: false }),
        default: null
    },
    revisionHistory: { type: [lessonBlockRevisionSchema], default: [] }
}, { _id: false });

const lessonContentSchema = new mongoose.Schema({
    overview: { type: String, default: '' },
    explanation: { type: String, default: '' },
    example: { type: String, default: '' },
    summary: { type: String, default: '' },
    practiceTip: { type: String, default: '' },
    keyPoints: { type: [String], default: [] },
    citations: { type: [lessonCitationSchema], default: [] },
    blocks: { type: [lessonBlockSchema], default: [] },
    notesVersion: { type: Number, default: 1 },
    generatedForLevel: { type: String, default: '' },
    pdfTitle: { type: String, default: '' },
    generatedAt: { type: Date, default: null }
}, { _id: false });

const assessmentBundleSchema = new mongoose.Schema({
    mcqs: { type: [mcqSchema], default: [] },
    written: { type: [writtenQuestionSchema], default: [] },
    code: { type: [codeTaskSchema], default: [] }
}, { _id: false });

const assessmentStateSchema = new mongoose.Schema({
    attemptsUsed: { type: Number, default: 0 },
    lastScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    confidence: { type: String, default: '' },
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },
    lastSubmission: { type: mongoose.Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null }
}, { _id: false });

const practiceSchema = new mongoose.Schema({
    bundle: {
        type: assessmentBundleSchema,
        default: () => ({})
    },
    state: {
        type: assessmentStateSchema,
        default: () => ({})
    },
    generatedAt: { type: Date, default: Date.now }
}, { _id: false });

const subtopicSchema = new mongoose.Schema({
    subtopic_id: { type: mongoose.Schema.Types.Mixed },
    subtopic_title: { type: String, default: '' },
    status: {
        type: String,
        enum: ['locked', 'active', 'completed'],
        default: 'locked'
    },
    subtopic_type: {
        type: String,
        enum: ['lesson', 'mini-project'],
        default: 'lesson'
    },
    generationStatus: {
        type: String,
        enum: ['pending', 'generating', 'ready', 'failed'],
        default: 'pending'
    },
    appliedConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    subtopicOverrideConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    lessonContent: {
        type: lessonContentSchema,
        default: () => ({})
    },
    practices: {
        type: [practiceSchema],
        default: []
    },
    mistakeLog: { type: [String], default: [] },
    studentNotes: { type: String, default: '' },
    tutorContextSummary: { type: String, default: '' }
}, { _id: false });

const moduleSchema = new mongoose.Schema({
    module_id: { type: mongoose.Schema.Types.Mixed },
    module_title: { type: String, default: '' },
    prepStatus: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'failed'],
        default: 'pending'
    },
    quizReport: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    subtopics: { type: [subtopicSchema], default: [] }
}, { _id: false });

const playlistVideoSchema = new mongoose.Schema({
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: Number, default: 0 },
    channel: { type: String, default: '' },
    channelId: { type: String, default: '' },
    transcript: { type: String, default: '' },
    quiz: { type: [mcqSchema], default: [] }
}, { _id: false });

const checkpointSubmissionSchema = new mongoose.Schema({
    attemptNumber: { type: Number, required: true },
    theoryAnswers: { type: [String], default: [] },
    codeFiles: { type: [{ fileName: String, content: String }], default: [] },
    score: { type: Number, default: 0 },
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },
    submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const checkpointSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['locked', 'available', 'passed', 'failed_all'],
        default: 'locked'
    },
    attemptsUsed: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastScore: { type: Number, default: 0 },
    questionType: {
        type: String,
        enum: ['theory', 'coding', 'mixed'],
        default: 'theory'
    },
    theoryQuestions: {
        type: [{ question: String }],
        default: []
    },
    codingQuestion: {
        prompt: { type: String, default: '' },
        language: { type: String, default: '' },
        expectedBehavior: { type: String, default: '' }
    },
    submissions: { type: [checkpointSubmissionSchema], default: [] }
}, { _id: false });

const daySchema = new mongoose.Schema({
    dayNumber: { type: Number, required: true },
    videos: { type: [playlistVideoSchema], default: [] },
    totalDuration: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['unprocessed', 'processing', 'ready', 'failed'],
        default: 'unprocessed'
    },
    checkpoint: {
        type: checkpointSchema,
        default: () => ({ status: 'locked' })
    }
}, { _id: false });

const studyConfigSchema = new mongoose.Schema({
    goal: { type: String, default: '' },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    explanationLength: {
        type: String,
        enum: ['short', 'standard', 'deep'],
        default: 'standard'
    },
    mcqEnabled: { type: Boolean, default: true },
    mcqCount: { type: Number, default: 3 },
    writtenEnabled: { type: Boolean, default: false },
    writtenCount: { type: Number, default: 0 },
    codeEnabled: { type: Boolean, default: false },
    codeCount: { type: Number, default: 0 },
    miniProjectsEnabled: { type: Boolean, default: false },
    miniProjectMode: {
        type: String,
        enum: ['auto', 'every-module'],
        default: 'auto'
    },
    webGroundingEnabled: { type: Boolean, default: false },
    interactiveWidgets: { type: Boolean, default: false }
}, { _id: false });

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
    sourceType: {
        type: String,
        enum: ['guided-topic', 'playlist', 'ai-generated'],
        default: 'guided-topic'
    },
    current_module_index: {
        type: Number,
        default: 0
    },
    current_subtopic_index: {
        type: Number,
        default: 0
    },
    modules: { type: [moduleSchema], default: [] },
    studyConfig: {
        type: studyConfigSchema,
        default: () => ({})
    },
    sourcePlaylistId: { type: String, default: '' },
    learningGoal: { type: String, default: '' },
    hoursPerDay: { type: Number, default: 2 },
    currentDayIndex: { type: Number, default: 0 },
    days: { type: [daySchema], default: [] }
}, { timestamps: true });

courseSchema.pre('validate', function() {
    if (this.modules && Array.isArray(this.modules)) {
        this.modules.forEach(mod => {
            if (mod.subtopics && Array.isArray(mod.subtopics)) {
                mod.subtopics.forEach(sub => {
                    if (sub.lessonContent && sub.lessonContent.citations) {
                        let rawCitations = sub.lessonContent.citations;
                        if (!Array.isArray(rawCitations)) {
                            rawCitations = [rawCitations];
                        }
                        sub.lessonContent.citations = rawCitations.map(cit => {
                            if (typeof cit === 'string') {
                                return { label: cit, url: '' };
                            } else if (cit && typeof cit === 'object') {
                                return {
                                    label: String(cit.label || cit.title || cit.name || ''),
                                    url: String(cit.url || cit.link || '')
                                };
                            }
                            return null;
                        }).filter(cit => cit && cit.label && cit.label.trim() !== '');
                    }
                });
            }
        });
    }
});

module.exports = mongoose.model('Course', courseSchema);
