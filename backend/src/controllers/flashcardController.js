const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
const Course = require('../models/Course');
const { generateFlashcardsForUser, calculateNextReview } = require('../services/flashcardService');

const getDailyDeck = async (req, res) => {
    try {
        const { clerkId } = req.params;
        if (!clerkId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // DATABASE HEALING AUTO-CLEANUP:
        // 1. Fetch user's actual courses
        const userCourses = await Course.find({ userId: user._id });
        const userCourseIds = userCourses.map(c => c._id.toString());

        // 2. Delete any flashcards that do not belong to any of the user's active courses
        await Flashcard.deleteMany({
            userId: user._id,
            courseId: { $nin: userCourseIds }
        });

        // 3. Check for biology keywords in flashcards when user does not have a biology course
        const biologyKeywords = ['mitochondria', 'vacuole', 'chloroplast', 'organelle', 'turgor pressure', 'cytoplasm', 'nucleus', 'cell wall'];
        const hasBiologyCourse = userCourses.some(c => 
            c.course_title.toLowerCase().includes('biology') || 
            c.course_title.toLowerCase().includes('cell')
        );

        if (!hasBiologyCourse && userCourseIds.length > 0) {
            // Delete flashcards containing biology keywords so they can be regenerated correctly
            await Flashcard.deleteMany({
                userId: user._id,
                $or: biologyKeywords.map(word => ({
                    $or: [
                        { front: { $regex: word, $options: 'i' } },
                        { back: { $regex: word, $options: 'i' } }
                    ]
                }))
            });
        }

        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD format based on UTC
        
        const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
        const cardsCreatedTodayCount = await Flashcard.countDocuments({
            userId: user._id,
            createdAt: { $gte: startOfDay }
        });

        // 4. If we haven't generated cards today (or if they were cleared), generate them (Just-In-Time)
        if (cardsCreatedTodayCount === 0) {
            console.log(`Generating new daily flashcards for user ${user._id}`);
            await generateFlashcardsForUser(user._id);
        }

        // 2. Fetch due cards OR cards interacted with today
        const deckCards = await Flashcard.find({
            userId: user._id,
            $or: [
                { nextReviewDate: { $lte: now } },
                { createdAt: { $gte: startOfDay } },
                { updatedAt: { $gte: startOfDay } }
            ]
        }).sort({ nextReviewDate: 1 }).limit(50);

        return res.json({ success: true, cards: deckCards });
    } catch (error) {
        console.error('getDailyDeck error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch daily deck' });
    }
};

const reviewCard = async (req, res) => {
    try {
        const { clerkId, cardId, grade } = req.body;
        if (!clerkId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!cardId || typeof grade !== 'number') {
            return res.status(400).json({ success: false, error: 'cardId and grade are required' });
        }

        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const card = await Flashcard.findOne({ _id: cardId, userId: user._id });
        if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

        const updates = calculateNextReview(card, grade);
        
        Object.assign(card, updates);
        await card.save();

        return res.json({ success: true, card });
    } catch (error) {
        console.error('reviewCard error:', error);
        return res.status(500).json({ success: false, error: 'Failed to review card' });
    }
};

module.exports = {
    getDailyDeck,
    reviewCard
};
