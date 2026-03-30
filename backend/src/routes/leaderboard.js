const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');

/**
 * GET /api/leaderboard?period=daily|weekly|monthly
 * Returns top 10 users ranked by topics completed in the given period.
 */
router.get('/', async (req, res) => {
    try {
        const period = req.query.period || 'weekly'; // daily | weekly | monthly
        const today = new Date();
        let startDate;

        switch (period) {
            case 'daily':
                startDate = today.toISOString().slice(0, 10);
                break;
            case 'weekly':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                startDate = weekAgo.toISOString().slice(0, 10);
                break;
            case 'monthly':
                const monthAgo = new Date(today);
                monthAgo.setDate(today.getDate() - 30);
                startDate = monthAgo.toISOString().slice(0, 10);
                break;
            default:
                startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().slice(0, 10);
        }

        const endDate = new Date().toISOString().slice(0, 10);

        // Aggregate activity data
        const pipeline = [
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    topicsCompleted: { $sum: '$subtopicsCompleted' },
                    activeDays: { $addToSet: '$date' }
                }
            },
            {
                $sort: { topicsCompleted: -1 }
            }
        ];

        const allResults = await Activity.aggregate(pipeline);
        const top10 = allResults.slice(0, 10);

        // Fetch user names for top 10
        const userIds = top10.map(r => r._id);
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = {
                name: u.name || 'Learner',
                clerkId: u.clerkId,
                plan: u.plan || 'free'
            };
        });

        const leaderboard = top10.map((entry, index) => ({
            rank: index + 1,
            userId: entry._id,
            name: userMap[entry._id.toString()]?.name || 'Learner',
            clerkId: userMap[entry._id.toString()]?.clerkId || '',
            plan: userMap[entry._id.toString()]?.plan || 'free',
            topicsCompleted: entry.topicsCompleted,
            activeDays: entry.activeDays.length
        }));

        // Calculate current user's stats if requested
        let currentUserStats = null;
        if (req.query.clerkId) {
            const caller = await User.findOne({ clerkId: req.query.clerkId }).lean();
            if (caller) {
                const callerIdStr = caller._id.toString();
                const rankIndex = allResults.findIndex(r => r._id.toString() === callerIdStr);
                
                if (rankIndex !== -1) {
                    const rank = rankIndex + 1;
                    const totalUsers = allResults.length;
                    const percentile = totalUsers > 1 ? Math.round(((totalUsers - rank) / (totalUsers - 1)) * 100) : 100;
                    
                    currentUserStats = {
                        rank,
                        percentile,
                        totalParticipants: totalUsers,
                        topicsCompleted: allResults[rankIndex].topicsCompleted
                    };
                } else {
                    // User has no activity in this period
                    currentUserStats = {
                        rank: null,
                        percentile: null,
                        totalParticipants: allResults.length,
                        topicsCompleted: 0
                    };
                }
            }
        }

        return res.json({
            success: true,
            period,
            leaderboard,
            currentUserStats
        });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
