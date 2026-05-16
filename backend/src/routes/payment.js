const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

let Razorpay = null;
try {
    Razorpay = require('razorpay');
} catch (error) {
    console.warn('Razorpay SDK not installed. Payment routes will return 503 until the dependency is available.');
}

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the specified plan.
 * Body: { clerkId, plan: 'pro' | 'ultra' }
 */
router.post('/create-order', async (req, res) => {
    try {
        if (!Razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is unavailable because the Razorpay SDK is not installed.'
            });
        }

        const { clerkId, plan } = req.body;

        if (!clerkId || !plan) {
            return res.status(400).json({ success: false, message: 'clerkId and plan are required' });
        }

        // ── Guard: check current plan before creating order ──
        const PLAN_TIERS = { free: 0, pro: 1, ultra: 2 };
        const existingUser = await User.findOne({ clerkId });
        const currentTier = PLAN_TIERS[existingUser?.plan] ?? 0;
        const newTier = PLAN_TIERS[plan] ?? -1;
        if (newTier <= currentTier) {
            return res.status(400).json({
                success: false,
                message: `You are already on the ${existingUser?.plan || 'free'} plan or higher. No payment needed.`
            });
        }

        let amount = 0;
        if (plan === 'pro') {
            amount = 4900; // ₹49 in paise
        } else if (plan === 'ultra') {
            amount = 9900; // ₹99 in paise
        } else {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const razorpay = new Razorpay({
            key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
            key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim()
        });

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
        }

        res.json({
            success: true,
            order: order,
            amount: amount,
            currency: 'INR'
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

/**
 * POST /api/payment/verify
 * Verifies the Razorpay payment signature and updates the user's plan.
 * Body: { clerkId, razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 */
router.post('/verify', async (req, res) => {
    try {
        const { clerkId, razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

        if (!clerkId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        // Verify signature
        const secret = (process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder').trim();
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid signature. Payment verification failed.' });
        }

        // Update user plan
        let user = await User.findOne({ clerkId });
        if (!user) {
            user = new User({ clerkId, name: 'Learner' });
        }

        // Reject if trying to "downgrade" via payment (e.g., ultra user buying pro)
        const PLAN_TIERS = { free: 0, pro: 1, ultra: 2 };
        const currentTier = PLAN_TIERS[user.plan] ?? 0;
        const newTier = PLAN_TIERS[plan] ?? 0;
        if (newTier <= currentTier) {
            return res.status(400).json({
                success: false,
                message: `You are already on a higher or equal plan (${user.plan}). No downgrade is allowed via payment.`
            });
        }

        // Upgrade: preserve existing balance, set fresh 30-day billing cycle
        user.plan = plan;
        user.credits.billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.credits.lastRefillDate = new Date();
        // Do NOT reset balance — let the user keep what they've earned
        user.markModified('credits');
        await user.save();

        res.json({
            success: true,
            message: `Payment successful. You are now on the ${plan.toUpperCase()} plan!`
        });

    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
