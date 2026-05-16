const User = require('../models/User');
const Course = require('../models/Course');
const {
    ACTION_LABELS,
    CREATION_CATEGORIES,
    PLAN_LIMITS,
    getActionLimit,
    getNormalizedPlan,
    getPlanLimits
} = require('../config/limitController');

const getCategoryConfig = (category = 'guided') => CREATION_CATEGORIES[category] || CREATION_CATEGORIES.guided;

const todayStr = () => new Date().toISOString().slice(0, 10);

const getWeeklyResetDate = async (userId, sourceType, weeklyLimit) => {
    if (!weeklyLimit) return null;

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
        const upgradeText = plan === 'ultra' ? `Delete an existing ${categoryConfig.singularLabel} to add a new one.` : `Delete one or upgrade to ${categoryConfig.upgradeTarget} for more.`;
        return {
            limitType: 'maxCourses',
            message: `You have reached the maximum of ${limits.maxCourses} ${categoryConfig.pluralLabel} on the ${planLabel} plan. ${upgradeText}`
        };
    }

    if (weeklyCount >= limits.coursesPerWeek) {
        const resetSuffix = nextAvailable ? ` You can create another after ${nextAvailable}.` : '';
        const upgradeText = plan === 'ultra' ? '' : ` Upgrade to ${categoryConfig.upgradeTarget} for more.`;
        return {
            limitType: 'weeklyLimit',
            message: `You have reached your weekly limit of ${limits.coursesPerWeek} ${categoryConfig.pluralLabel} on the ${planLabel} plan.${resetSuffix}${upgradeText}`
        };
    }

    return { limitType: null, message: '' };
};

const getCourseCreationStatus = async (user, category = 'guided') => {
    const normalizedPlan = getNormalizedPlan(user?.plan);
    const limits = getPlanLimits(normalizedPlan);
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

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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

const checkCourseCreation = (category = 'guided') => async (req, res, next) => {
    try {
        const { clerkId } = req.body;
        if (!clerkId) return next();

        const user = await User.findOne({ clerkId });
        if (!user) return next();

        const normalizedPlan = getNormalizedPlan(user.plan);
        const limits = getPlanLimits(normalizedPlan);
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

        req.dbUser = user;
        req.planLimits = limits;
        req.creationCategory = category;
        next();
    } catch (err) {
        console.error('usageLimiter error:', err.message);
        next();
    }
};

const getDailyAIUsage = (user) => {
    const today = todayStr();
    const usage = user?.aiActionUsage || {};

    if (usage.date === today) {
        return { date: today, actions: { ...(usage.actions || {}) } };
    }

    return { date: today, actions: {} };
};

const getAIActionStatus = (user, actionKey) => {
    const plan = getNormalizedPlan(user?.plan);
    const limit = getActionLimit(plan, actionKey);
    const usage = getDailyAIUsage(user);
    const used = Number(usage.actions[actionKey] || 0);
    const remaining = Math.max(limit - used, 0);

    return {
        actionKey,
        label: ACTION_LABELS[actionKey] || actionKey,
        plan,
        limit,
        used,
        remaining,
        canUse: used < limit,
        resetsOn: usage.date
    };
};

const getAllAIActionStatuses = (user) => {
    const plan = getNormalizedPlan(user?.plan);
    const limits = getPlanLimits(plan).aiActionsPerDay;

    return Object.keys(limits).reduce((acc, actionKey) => {
        acc[actionKey] = getAIActionStatus(user, actionKey);
        return acc;
    }, {});
};

const recordAIActionForUser = async (user, actionKey, count = 1) => {
    if (!user || !actionKey) return;

    const usage = getDailyAIUsage(user);
    usage.actions[actionKey] = Number(usage.actions[actionKey] || 0) + count;
    user.aiActionUsage = usage;

    if (actionKey === 'tutorChat') {
        user.aiChatUsage = { date: usage.date, count: usage.actions[actionKey] };
    }

    user.markModified('aiActionUsage');
    await user.save();
};

const assertAIActionForUser = (user, actionKey, count = 1) => {
    const status = getAIActionStatus(user, actionKey);
    if (status.remaining < count) {
        const planLabel = status.plan.toUpperCase();
        const message = `You have reached your daily limit of ${status.limit} ${status.label} on the ${planLabel} plan.`;
        const error = new Error(message);
        error.statusCode = 403;
        error.limitReached = true;
        error.usageStatus = status;
        throw error;
    }

    return status;
};

const consumeAIActionForUser = async (user, actionKey, count = 1) => {
    assertAIActionForUser(user, actionKey, count);
    await recordAIActionForUser(user, actionKey, count);
    return getAIActionStatus(user, actionKey);
};

const recordAIAction = async (clerkId, actionKey, count = 1) => {
    const user = await User.findOne({ clerkId });
    if (!user) return;
    await recordAIActionForUser(user, actionKey, count);
};

const checkAIActionLimit = (actionKey = 'tutorChat') => async (req, res, next) => {
    try {
        const clerkId = req.body.clerkId || req.query.clerkId;
        if (!clerkId) return next();

        const user = await User.findOne({ clerkId });
        if (!user) return next();

        const status = getAIActionStatus(user, actionKey);
        if (!status.canUse) {
            return res.status(403).json({
                success: false,
                limitReached: true,
                actionKey,
                usage: status,
                currentPlan: status.plan,
                message: `You have reached your daily limit of ${status.limit} ${status.label} on the ${status.plan.toUpperCase()} plan.`
            });
        }

        req.dbUser = user;
        req.aiActionStatus = status;
        next();
    } catch (err) {
        console.error('checkAIActionLimit error:', err.message);
        next();
    }
};

const checkAIChatLimit = checkAIActionLimit('tutorChat');

const recordAIChat = async (clerkId) => recordAIAction(clerkId, 'tutorChat');

module.exports = {
    PLAN_LIMITS,
    CREATION_CATEGORIES,
    checkCourseCreation,
    getCourseCreationStatus,
    getNormalizedPlan,
    assertAIActionForUser,
    checkAIActionLimit,
    checkAIChatLimit,
    consumeAIActionForUser,
    getAIActionStatus,
    getAllAIActionStatuses,
    recordAIAction,
    recordAIActionForUser,
    recordAIChat
};
