const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { getCreditStatus, maybeRefillCredits } = require('../middleware/creditManager');
const { ACTION_COSTS, getNormalizedPlan, getStudyControlLimits } = require('../config/creditConfig');

/**
 * GET /api/user/:clerkId/usage
 * Returns current plan, credit balance, and allowance info.
 */
router.get('/:clerkId/usage', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const { name } = req.query;
        const user = await User.findOne({ clerkId });
        
        if (user && name && user.name !== name) {
            user.name = name;
            await user.save();
        }

        if (!user) {
            const status = getCreditStatus(null);
            return res.json({
                success: true,
                ...status,
                studyControls: getStudyControlLimits('free'),
                actionCosts: buildActionCostsForPlan('free'),
            });
        }

        await maybeRefillCredits(user);
        const status = getCreditStatus(user);

        return res.json({
            success: true,
            ...status,
            studyControls: getStudyControlLimits(user.plan),
            actionCosts: buildActionCostsForPlan(user.plan),
        });
    } catch (err) {
        console.error('Error fetching user usage:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

/**
 * GET /api/user/:clerkId/transactions
 * Returns paginated credit transaction ledger.
 * Query: ?page=1&limit=30
 */
router.get('/:clerkId/transactions', async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.json({ success: true, transactions: [], total: 0, page: 1 });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            CreditTransaction.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CreditTransaction.countDocuments({ userId: user._id })
        ]);

        return res.json({
            success: true,
            transactions,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

/**
 * POST /api/user/:clerkId/upgrade
 * Admin-only: Manually set a user's plan. Requires ADMIN_SECRET header.
 */
router.post('/:clerkId/upgrade', async (req, res) => {
    try {
        // ── Admin secret guard ──
        const adminSecret = process.env.ADMIN_SECRET;
        const providedSecret = req.headers['x-admin-secret'];
        if (!adminSecret || providedSecret !== adminSecret) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { clerkId } = req.params;
        const { plan = 'pro' } = req.body;
        const validPlan = ['pro', 'ultra'].includes(plan) ? plan : 'pro';

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.plan = validPlan;
        // Set billing cycle end to 30 days from now
        user.credits.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        // Reset balance and refill date for clean start
        user.credits.balance = validPlan === 'ultra' ? 300 : 150;
        user.credits.lastRefillDate = new Date();
        user.markModified('credits');
        await user.save();

        return res.json({ success: true, plan: user.plan, message: `Upgraded to ${validPlan.charAt(0).toUpperCase() + validPlan.slice(1)}!` });
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

// ── Helper: Build action costs object for frontend ──
function buildActionCostsForPlan(plan) {
    const p = getNormalizedPlan(plan);
    const tier = p === 'free' ? 'standard' : 'advanced';
    const result = {};
    for (const [key, costs] of Object.entries(ACTION_COSTS)) {
        result[key] = costs[tier];
    }
    return result;
}

module.exports = router;
