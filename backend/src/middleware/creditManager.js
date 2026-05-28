const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const {
    getNormalizedPlan,
    getCostForAction,
    getPlanCredits,
    ACTION_LABELS,
} = require('../config/creditConfig');

// ── Refill Logic ──

/**
 * Check if a user's credits should be refilled and do it if needed.
 * - Free: Refill every 7 days, NO rollover (reset to allowance).
 * - Pro/Ultra: Refill every 1 day, credits accumulate.
 *   But if billingCycleEnd has passed, wipe to 0 and add daily allowance.
 */
const maybeRefillCredits = async (user) => {
    if (!user) return;

    const plan = getNormalizedPlan(user.plan);
    const config = getPlanCredits(plan);
    const now = new Date();
    const lastRefill = user.credits?.lastRefillDate ? new Date(user.credits.lastRefillDate) : null;

    // ── Monthly wipe check for paid users ──
    if (plan !== 'free' && user.credits?.billingCycleEnd) {
        const cycleEnd = new Date(user.credits.billingCycleEnd);
        if (now >= cycleEnd) {
            // Billing cycle has ended — downgrade to free plan
            const freeAllowance = getPlanCredits('free').allowance; // 200, from creditConfig
            user.plan = 'free';
            user.credits.balance = freeAllowance;
            user.credits.billingCycleEnd = null;
            user.credits.lastRefillDate = now;
            user.markModified('credits');
            await user.save();

            await CreditTransaction.create({
                userId: user._id,
                amount: freeAllowance,
                type: 'refill',
                actionKey: 'billingCycleReset',
                description: 'Subscription expired — downgraded to Free plan',
                balanceAfter: freeAllowance
            });
            return;
        }
    }

    // ── Calculate refill interval ──
    // If lastRefill is null (new user), treat as needing immediate refill
    if (lastRefill) {
        const msSinceRefill = now.getTime() - lastRefill.getTime();
        const intervalMs = config.refillInterval === 'weekly'
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

        if (msSinceRefill < intervalMs) return; // Not time yet
    }

    // ── Refill: always give exactly ONE interval's worth ──
    let newBalance;
    let description;

    if (plan === 'free') {
        // Free: NO rollover — hard reset to allowance
        newBalance = config.allowance;
        description = `Weekly free refill`;
    } else {
        // Paid: Accumulate — add one daily allowance
        newBalance = (user.credits?.balance || 0) + config.allowance;
        description = `Daily ${plan} refill`;
    }

    user.credits.balance = newBalance;
    user.credits.lastRefillDate = now;
    user.markModified('credits');
    await user.save();

    await CreditTransaction.create({
        userId: user._id,
        amount: config.allowance,
        type: 'refill',
        actionKey: 'creditRefill',
        description,
        balanceAfter: newBalance
    });
};

// ── Spend Logic ──

/**
 * Check if the user has enough credits for an action.
 * Does NOT deduct — call spendCredits after the action succeeds.
 */
const assertCredits = (user, actionKey) => {
    const plan = getNormalizedPlan(user?.plan);
    const cost = getCostForAction(plan, actionKey);

    if (cost === 0) return { cost, balance: user?.credits?.balance || 0 };

    const balance = user?.credits?.balance || 0;
    if (balance < cost) {
        const label = ACTION_LABELS[actionKey] || actionKey;
        const error = new Error(
            `Not enough credits for "${label}". Cost: ${cost} credits, your balance: ${balance} credits.`
        );
        error.statusCode = 403;
        error.creditError = true;
        error.creditInfo = { cost, balance, actionKey };
        throw error;
    }

    return { cost, balance };
};

/**
 * Deduct credits and log the transaction.
 */
const spendCredits = async (user, actionKey, customCost = null) => {
    if (!user) return;

    const plan = getNormalizedPlan(user.plan);
    const cost = customCost !== null ? customCost : getCostForAction(plan, actionKey);
    if (cost === 0) return;

    user.credits.balance = Math.max(0, (user.credits.balance || 0) - cost);
    user.markModified('credits');
    await user.save();

    const label = ACTION_LABELS[actionKey] || actionKey;
    const tier = plan === 'free' ? 'Standard AI' : 'Advanced AI';

    await CreditTransaction.create({
        userId: user._id,
        amount: -cost,
        type: 'spend',
        actionKey,
        description: `${label} (${tier})`,
        balanceAfter: user.credits.balance
    });
};

// ── Express Middleware ──

/**
 * Middleware factory: checks credits for a given action key.
 * Also runs the refill check before asserting.
 */
const checkCredits = (actionKey) => async (req, res, next) => {
    try {
        const clerkId = req.body.clerkId || req.query.clerkId;
        if (!clerkId) return next();

        const user = await User.findOne({ clerkId });
        if (!user) return next();

        await maybeRefillCredits(user);

        const plan = getNormalizedPlan(user.plan);
        const cost = getCostForAction(plan, actionKey);
        const balance = user.credits?.balance || 0;

        if (balance < cost) {
            const label = ACTION_LABELS[actionKey] || actionKey;
            return res.status(403).json({
                success: false,
                creditError: true,
                actionKey,
                cost,
                balance,
                plan,
                message: `Not enough credits for "${label}". Cost: ${cost}, balance: ${balance}.`
            });
        }

        req.dbUser = user;
        req.creditCost = cost;
        next();
    } catch (err) {
        console.error('checkCredits middleware error:', err.message);
        next();
    }
};

/**
 * Get a summary of a user's credit status for the frontend.
 */
const getCreditStatus = (user) => {
    const plan = getNormalizedPlan(user?.plan);
    const config = getPlanCredits(plan);

    return {
        plan,
        balance: user?.credits?.balance ?? config.allowance,
        allowance: config.allowance,
        refillInterval: config.refillInterval,
        billingCycleEnd: user?.credits?.billingCycleEnd || null,
        lastRefillDate: user?.credits?.lastRefillDate || null,
        modelTier: plan === 'free' ? 'standard' : 'advanced',
    };
};

module.exports = {
    maybeRefillCredits,
    assertCredits,
    spendCredits,
    checkCredits,
    getCreditStatus,
};
