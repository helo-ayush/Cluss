const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    
    // Spaced Repetition (SM-2) Fields
    nextReviewDate: { type: Date, default: Date.now },
    interval: { type: Number, default: 0 }, // in days
    repetition: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 }
}, { timestamps: true });

// Index for efficient querying of due cards for a user
flashcardSchema.index({ userId: 1, nextReviewDate: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
