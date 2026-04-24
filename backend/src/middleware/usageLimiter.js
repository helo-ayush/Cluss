    const User = require('../models/User');
const Course = require('../models/Course');

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
        coursesPerWeek: 5,
        topicUnlocksPerCoursePerDay: 3,
        quizPassThreshold: 70,
        maxAiChatPerDay: 50
    },
    ultra: {
        maxCourses: 50,
        coursesPerWeek: 15,
        topicUnlocksPerCoursePerDay: 10,
        quizPassThreshold: 60,
        maxAiChatPerDay: Infinity
    }
};

const CREATION_CATEGORIES = {
    forge: {
        sourceType: 'ai-generated',
        singularLabel: 'forge course',
        pluralLabel: 'forge courses',
        upgradeTarget: 'Pro'
    },
    playlist: {
        sourceType: 'playlist',
        singularLabel: 'playlist course',
        pluralLabel: 'playlist courses',
        upgradeTarget: 'Pro'
    }
};

const getNormalizedPlan = (plan) => PLAN_LIMITS[plan] ? plan : 'free';

const getCategoryConfig = (category = 'forge') => CREATION_CATEGORIES[category] || CREATION_CATEGORIES.forge;

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

const getWeeklyResetDate = async (userId, sourceType, weeklyLimit) => {
    if (!weeklyLimit || weeklyLimit === Infinity) return null;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentCourses = await Course.find({
        userId,
        sourceType,
        createdAt: { $gte: oneWeekAgo }
    })
        .sort({ createdAt: 1 })
        .select('createdAt')
        .limit(weeklyLimit);

    if (recentCourses.length < weeklyLimit) return null;

    const oldestTracked = recentCourses[0]?.createdAt;
    if (!oldestTracked) return null;

    return new Date(oldestTracked.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
};

const buildLimitMessage = ({ plan, limits, category, activeCount, weeklyCount, nextAvailable }) => {
    const categoryConfig = getCategoryConfig(category);
    const planLabel = plan.toUpperCase();

    if (activeCount >= limits.maxCourses) {
        if (plan === 'ultra') {
            return {
                limitType: 'maxCourses',
                message: `You have reached the maximum of ${limits.maxCourses} ${categoryConfig.pluralLabel} on the ${planLabel} plan. Delete an existing ${categoryConfig.singularLabel} to add a new one.`
            };
        }

        return {
            limitType: 'maxCourses',
            message: `You have reached the maximum of ${limits.maxCourses} ${categoryConfig.pluralLabel} on the ${planLabel} plan. Delete one or upgrade to ${categoryConfig.upgradeTarget} for more.`
        };
    }

    if (weeklyCount >= limits.coursesPerWeek) {
        const resetSuffix = nextAvailable ? ` You can create another after ${nextAvailable}.` : '';
        if (plan === 'ultra') {
            return {
                limitType: 'weeklyLimit',
                message: `You have reached your weekly limit of ${limits.coursesPerWeek} ${categoryConfig.pluralLabel} on the ${planLabel} plan.${resetSuffix}`
            };
        }

        return {
            limitType: 'weeklyLimit',
            message: `You have reached your weekly limit of ${limits.coursesPerWeek} ${categoryConfig.pluralLabel} on the ${planLabel} plan.${resetSuffix} Upgrade to ${categoryConfig.upgradeTarget} for more.`
        };
    }

    return {
        limitType: null,
        message: ''
    };
};

const getCourseCreationStatus = async (user, category = 'forge') => {
    const normalizedPlan = getNormalizedPlan(user?.plan);
    const limits = PLAN_LIMITS[normalizedPlan];
    const categoryConfig = getCategoryConfig(category);

    if (!user?._id) {
        return {
            category,
            sourceType: categoryConfig.sourceType,
            activeCount: 0,
            weeklyCount: 0,
            maxCourses: limits.maxCourses,
            weeklyLimit: limits.coursesPerWeek,
            canCreate: true,
            nextAvailable: null,
            limitType: null,
            message: ''
        };
    }

    const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const [activeCount, weeklyCount] = await Promise.all([
        Course.countDocuments({ userId: user._id, sourceType: categoryConfig.sourceType }),
        Course.countDocuments({
            userId: user._id,
            sourceType: categoryConfig.sourceType,
            createdAt: { $gte: oneWeekAgo }
        })
    ]);

    const nextAvailable = weeklyCount >= limits.coursesPerWeek
        ? await getWeeklyResetDate(user._id, categoryConfig.sourceType, limits.coursesPerWeek)
        : null;

    const canCreate = activeCount < limits.maxCourses && weeklyCount < limits.coursesPerWeek;
    const { limitType, message } = buildLimitMessage({
        plan: normalizedPlan,
        limits,
        category,
        activeCount,
        weeklyCount,
        nextAvailable
    });

    return {
        category,
        sourceType: categoryConfig.sourceType,
        activeCount,
        weeklyCount,
        maxCourses: limits.maxCourses,
        weeklyLimit: limits.coursesPerWeek,
        canCreate,
        nextAvailable,
        limitType,
        message
    };
};

/**
 * Middleware: Checks if the user can create a new course.
 * Expects clerkId in req.body
 */
const checkCourseCreation = (category = 'forge') => async (req, res, next) => {
    try {
        const { clerkId } = req.body;
        if (!clerkId) return next(); // Let the handler deal with missing clerkId

        const user = await User.findOne({ clerkId });
        if (!user) return next(); // New user, will be created in handler

        const normalizedPlan = getNormalizedPlan(user.plan);
        const limits = PLAN_LIMITS[normalizedPlan];
        const status = await getCourseCreationStatus(user, category);

        if (!status.canCreate) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                limitType: status.limitType,
                message: status.message,
                currentPlan: normalizedPlan,
                category,
                nextAvailable: status.nextAvailable
            });
        }

        // Attach user and limits to request for downstream use
        req.dbUser = user;
        req.planLimits = limits;
        req.creationCategory = category;
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
    CREATION_CATEGORIES,
    checkCourseCreation,
    getCourseCreationStatus,
    getNormalizedPlan,
    checkTopicUnlock,
    recordTopicUnlock,
    checkAIChatLimit,
    recordAIChat
};
