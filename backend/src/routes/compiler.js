const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const compilerManager = require('../services/compilerManager');

// In-memory rate limiting map (clerkId -> timestamp of last execution)
const lastSubmissionTimes = new Map();
const COOLDOWN_MS = 10000; // 10 seconds

router.post('/run', requireAuth, async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Spam protection rate limit check
        const now = Date.now();
        const lastTime = lastSubmissionTimes.get(clerkId) || 0;
        const timePassed = now - lastTime;

        if (timePassed < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - timePassed) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remaining} second(s) before running code again.`
            });
        }

        const { code, language, stdin = '', timeout = 3.0 } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Code is required'
            });
        }

        if (!language || typeof language !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Language is required'
            });
        }

        // Update the last run timestamp for this user
        lastSubmissionTimes.set(clerkId, now);

        console.log(`[Compiler Route] User ${clerkId} running ${language} code.`);
        
        // Delegate execution to compiler manager
        const result = await compilerManager.runCode(code, language, stdin, timeout);

        return res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error in compiler route:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Compilation service error'
        });
    }
});

module.exports = router;
