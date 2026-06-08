const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { checkCredits, spendCredits } = require('../middleware/creditManager');
const { getModelForPlan } = require('../config/creditConfig');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/playground/chat
 * AI Playground Chat (Chat Mode & Agent Mode)
 * Accepts: { clerkId, message, history[], code, language, mode }
 * Returns: { success, reply }
 */
router.post('/chat', checkCredits('playgroundChat'), async (req, res) => {
    try {
        const { clerkId, message, history, code, language, mode } = req.body;

        if (!clerkId || !message) {
            return res.status(400).json({ success: false, message: 'clerkId and message are required' });
        }

        const user = req.dbUser || await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // System prompt depends on the mode
        let systemPrompt = '';
        if (mode === 'agent') {
            systemPrompt = `You are the "Cluss Code Agent", a world-class AI programming agent.
Your primary role is to help the user modify, fix, refactor, or write code directly inside their playground editor.

Current Editor State:
- Programming Language: ${language}
- Current Code in Editor:
\`\`\`${language}
${code || '// Empty editor'}
\`\`\`

INSTRUCTIONS FOR AGENT MODE:
1. Carefully analyze the user's request: "${message}".
2. You MUST write the complete, updated code. Do NOT write placeholders, snippets, or leave things as '// ... rest of code'. The code must be complete and runnable.
3. You MUST format the complete updated code inside a standard markdown code block starting with \`\`\`${language} and ending with \`\`\`. Example:
\`\`\`${language}
// Full code here...
\`\`\`
4. Explain clearly and concisely what changes you made, what was fixed, or what features you added.
5. Keep your tone professional, helpful, and concise.`;
        } else {
            systemPrompt = `You are "Cluss", a world-class AI programming tutor.
Your role is to help the user learn programming, understand concepts, explain syntax, and debug errors.

Current Editor State:
- Programming Language: ${language}
- Current Code in Editor:
\`\`\`${language}
${code || '// Empty editor'}
\`\`\`

INSTRUCTIONS FOR CHAT MODE:
1. The user wants to learn or discuss programming: "${message}".
2. Explain things step-by-step using clear, simple analogies and examples.
3. If they have errors in their code, guide them on how to fix them instead of just giving the final answer immediately, or show explanatory snippets.
4. Keep the code examples small and focused. Do NOT output a full rewrite of the code block unless they explicitly ask for it.
5. Keep your tone encouraging, patient, and warm (like a helpful big brother).`;
        }

        // Initialize model
        const geminiModel = getModelForPlan(user.plan);
        const model = genAI.getGenerativeModel({ model: geminiModel });

        // Format history for Gemini chat
        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nPlease acknowledge you are ready." }] },
                { role: 'model', parts: [{ text: "Hello! I am ready to assist. Please let me know how I can help with your code." }] },
                ...chatHistory
            ]
        });

        // Deduct credits
        await spendCredits(user, 'playgroundChat');

        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        return res.json({
            success: true,
            reply: aiResponse.trim()
        });

    } catch (error) {
        console.error('AI Playground Chat Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Internal server error'
        });
    }
});

module.exports = router;
