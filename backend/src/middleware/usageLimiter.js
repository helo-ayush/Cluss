    const User = require('../models/User');
const Course = require('../models/Course');

// ── Plan Limits ──
const PLAN_LIMITS = {
    free: {
        maxCourses: 3,
        coursesPerWeek: 1,
        topicUnlocksPerCoursePerDay: 1,
        quizPassThreshold: 80,
        maxAiChatPerDay: 10
    },
    pro: {
        maxCourses: 10,
        coursesPerWeek: 1,
        topicUnlocksPerCoursePerDay: 3,
        quizPassThreshold: 70,
        maxAiChatPerDay: 50
    },
    ultra: {
        maxCourses: Infinity,
        coursesPerWeek: 1,
        topicUnlocksPerCoursePerDay: 10,
        quizPassThreshold: 60,
        maxAiChatPerDay: Infinity
    }
};

/**
 * Helper to get current date string
 */
const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Helper to check if a date is within the last 7 days
 */
const isWithinLastWeek = (date) => {
    if (!date) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(date) > oneWeekAgo;
};

/**
 * Middleware: Checks if the user can create a new course.
 * Expects clerkId in req.body
 */
const checkCourseCreation = async (req, res, next) => {
    try {
        const { clerkId } = req.body;
        if (!clerkId) return next(); // Let the handler deal with missing clerkId

        const user = await User.findOne({ clerkId });
        if (!user) return next(); // New user, will be created in handler

        const limits = PLAN_LIMITS[user.plan || 'free'];

        // Check 1: Max courses in profile
        const activeCourseCount = await Course.countDocuments({ userId: user._id });
        if (activeCourseCount >= limits.maxCourses) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                limitType: 'maxCourses',
                message: `You've reached the maximum of ${limits.maxCourses} Playlist/Courses on the Free plan. Upgrade to Pro for unlimited profile storage!`,
                currentPlan: user.plan
            });
        }

        // Check 2: 1 course per week
        if (isWithinLastWeek(user.lastCourseCreatedAt)) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                limitType: 'weeklyLimit',
                message: 'All users are limited to 1 generated course per week to ensure quality.',
                currentPlan: user.plan,
                nextAvailable: new Date(new Date(user.lastCourseCreatedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // Attach user and limits to request for downstream use
        req.dbUser = user;
        req.planLimits = limits;
        next();
    } catch (err) {
        console.error('usageLimiter error:', err.message);
        next(); // Don't block on middleware errors
    }
};

/**
 * Middleware: Checks daily topic unlock limit for free users.
 * Expects courseId in req.params and clerkId derived from the course's userId
 */
const checkTopicUnlock = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) return next();

        const user = await User.findById(course.userId);
        if (!user) return next();

        const limits = PLAN_LIMITS[user.plan || 'free'];
        const today = todayStr();

        // Find today's unlock record for this course
        const unlockRecord = user.topicUnlocks.find(
            u => u.courseId?.toString() === courseId && u.date === today
        );

        const currentCount = unlockRecord ? unlockRecord.count : 0;

        if (currentCount >= limits.topicUnlocksPerCoursePerDay) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                limitType: 'dailyTopicLimit',
                message: `You've reached your limit of ${limits.topicUnlocksPerCoursePerDay} topic unlocks per day for this course.`,
                currentPlan: user.plan
            });
        }

        // Attach for downstream
        req.dbUser = user;
        req.planLimits = limits;
        next();
    } catch (err) {
        console.error('checkTopicUnlock error:', err.message);
        next();
    }
};

/**
 * Increments the daily topic unlock counter for a user + course.
 */
const recordTopicUnlock = async (userId, courseId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const today = todayStr();
        const existing = user.topicUnlocks.find(
            u => u.courseId?.toString() === courseId.toString() && u.date === today
        );

        if (existing) {
            existing.count += 1;
        } else {
            // Clean up old entries (keep only last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().slice(0, 10);
            user.topicUnlocks = user.topicUnlocks.filter(u => u.date >= weekAgoStr);

            user.topicUnlocks.push({ courseId, date: today, count: 1 });
        }

        await user.save();
    } catch (err) {
        console.error('recordTopicUnlock error:', err.message);
    }
};

/**
 * Middleware: Checks daily AI chat limits.
 */
const checkAIChatLimit = async (req, res, next) => {
    try {
        const clerkId = req.body.clerkId;
        if (!clerkId) return next();

        const user = await User.findOne({ clerkId });
        if (!user) return next();

        const limits = PLAN_LIMITS[user.plan || 'free'];
        if (limits.maxAiChatPerDay === Infinity) return next();

        const today = todayStr();
        const chatUsage = user.aiChatUsage || {};

        if (chatUsage.date === today && chatUsage.count >= limits.maxAiChatPerDay) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                message: `You've reached your limit of ${limits.maxAiChatPerDay} AI chat messages for today. Upgrade to a higher plan for more!`,
                currentPlan: user.plan
            });
        }

        next();
    } catch (err) {
        console.error('checkAIChatLimit error:', err.message);
        next();
    }
};

/**
 * Increments AI Chat Usage
 */
const recordAIChat = async (clerkId) => {
    try {
        const user = await User.findOne({ clerkId });
        if (!user) return;

        const today = todayStr();
        if (!user.aiChatUsage || user.aiChatUsage.date !== today) {
            user.aiChatUsage = { date: today, count: 1 };
        } else {
            user.aiChatUsage.count += 1;
        }
        await user.save();
    } catch (err) {
        console.error('recordAIChat error:', err.message);
    }
};

module.exports = {
    PLAN_LIMITS,
    checkCourseCreation,
    checkTopicUnlock,
    recordTopicUnlock,
    checkAIChatLimit,
    recordAIChat
};
