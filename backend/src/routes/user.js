const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { PLAN_LIMITS, getCourseCreationStatus, getNormalizedPlan } = require('../middleware/usageLimiter');

/**
 * GET /api/user/:clerkId/usage
 * Returns current plan, usage stats, and remaining limits for the frontend.
 */
router.get('/:clerkId/usage', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });
        const plan = getNormalizedPlan(user?.plan);
        const limits = PLAN_LIMITS[plan];
        const today = new Date().toISOString().slice(0, 10);

        if (!user) {
            const emptyPermission = {
                canCreate: true,
                limitType: null,
                message: '',
                nextAvailable: null,
                activeCount: 0,
                weeklyCount: 0,
                maxCourses: limits.maxCourses,
                weeklyLimit: limits.coursesPerWeek
            };

            return res.json({
                success: true,
                plan,
                limits,
                usage: {
                    totalCoursesCreated: 0,
                    forge: { activeCourses: 0, weeklyCreated: 0 },
                    playlist: { activeCourses: 0, weeklyCreated: 0 },
                    todayTopicUnlocks: {}
                },
                permissions: {
                    forge: emptyPermission,
                    playlist: emptyPermission
                },
                canCreateCourse: true,
                canImportPlaylist: true,
                nextCourseAvailable: null,
                nextPlaylistAvailable: null
            });
        }

        const [forgeStatus, playlistStatus] = await Promise.all([
            getCourseCreationStatus(user, 'forge'),
            getCourseCreationStatus(user, 'playlist')
        ]);

        const todayUnlocks = {};
        (user.topicUnlocks || []).forEach(u => {
            if (u.date === today) {
                todayUnlocks[u.courseId.toString()] = u.count;
            }
        });

        return res.json({
            success: true,
            plan,
            limits,
            usage: {
                totalCoursesCreated: user.coursesCreated || 0,
                forge: {
                    activeCourses: forgeStatus.activeCount,
                    weeklyCreated: forgeStatus.weeklyCount
                },
                playlist: {
                    activeCourses: playlistStatus.activeCount,
                    weeklyCreated: playlistStatus.weeklyCount
                },
                todayTopicUnlocks: todayUnlocks
            },
            permissions: {
                forge: forgeStatus,
                playlist: playlistStatus
            },
            canCreateCourse: forgeStatus.canCreate,
            canImportPlaylist: playlistStatus.canCreate,
            nextCourseAvailable: forgeStatus.nextAvailable,
            nextPlaylistAvailable: playlistStatus.nextAvailable
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
            { returnDocument: 'after' }
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

/**
 * GET /api/user/:clerkId/avatar
 * Fetch the user's selected avatar.
 */
router.get('/:clerkId/avatar', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });
        res.json({ success: true, avatar: user?.avatar || 'none' });
    } catch (err) {
        console.error('Error fetching user avatar:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

/**
 * POST /api/user/:clerkId/avatar
 * Update the user's selected avatar.
 */
router.post('/:clerkId/avatar', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const { avatar } = req.body;
        const user = await User.findOneAndUpdate(
            { clerkId },
            { avatar },
            { returnDocument: 'after', upsert: true }
        );
        res.json({ success: true, avatar: user.avatar });
    } catch (err) {
        console.error('Error updating user avatar:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
