const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { PLAN_LIMITS } = require('../middleware/usageLimiter');

/**
 * GET /api/user/:clerkId/usage
 * Returns current plan, usage stats, and remaining limits for the frontend.
 */
router.get('/:clerkId/usage', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });

        if (!user) {
            // New user — return default free limits
            return res.json({
                success: true,
                plan: 'free',
                limits: PLAN_LIMITS.free,
                usage: { coursesCreated: 0, activeCourses: 0 },
                canCreateCourse: true,
                nextCourseAvailable: null
            });
        }

        const limits = PLAN_LIMITS[user.plan || 'free'];
        const activeCourses = await Course.countDocuments({ userId: user._id });

        // Check if user can create a course
        let canCreateCourse = true;
        let nextCourseAvailable = null;

        if (user.plan !== 'pro') {
            // Max courses check
            if (activeCourses >= limits.maxCourses) {
                canCreateCourse = false;
            }
            // Weekly limit check
            if (user.lastCourseCreatedAt) {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                if (new Date(user.lastCourseCreatedAt) > oneWeekAgo) {
                    canCreateCourse = false;
                    nextCourseAvailable = new Date(
                        new Date(user.lastCourseCreatedAt).getTime() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString();
                }
            }
        }

        // Today's topic unlocks per course
        const today = new Date().toISOString().slice(0, 10);
        const todayUnlocks = {};
        (user.topicUnlocks || []).forEach(u => {
            if (u.date === today) {
                todayUnlocks[u.courseId.toString()] = u.count;
            }
        });

        return res.json({
            success: true,
            plan: user.plan || 'free',
            limits,
            usage: {
                coursesCreated: user.coursesCreated || 0,
                activeCourses,
                lastCourseCreatedAt: user.lastCourseCreatedAt,
                todayTopicUnlocks: todayUnlocks
            },
            canCreateCourse,
            nextCourseAvailable
        });
    } catch (err) {
        console.error('Error fetching user usage:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

/**
 * POST /api/user/:clerkId/upgrade
 * Manually upgrade a user to Pro (placeholder until payment is wired up).
 */
router.post('/:clerkId/upgrade', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOneAndUpdate(
            { clerkId },
            { plan: 'pro' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, plan: user.plan, message: 'Upgraded to Pro!' });
    } catch (err) {
        console.error('Error upgrading user:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
