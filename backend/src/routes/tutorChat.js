const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /api/tutor-chat
 * AI Tutor Chat — Pro users only.
 * Accepts: { clerkId, courseId, moduleIndex, subtopicIndex, message, history[] }
 * Returns: { success, reply }
 */
router.post('/', async (req, res) => {
    try {
        const { clerkId, courseId, moduleIndex, subtopicIndex, message, history } = req.body;

        if (!clerkId || !courseId || !message) {
            return res.status(400).json({ success: false, message: 'clerkId, courseId, and message are required' });
        }

        // Check Pro plan
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.plan !== 'pro') {
            return res.status(403).json({
                success: false,
                limitReached: true,
                limitType: 'proOnly',
                message: 'AI Tutor Chat is a Pro feature. Upgrade to Pro to unlock personalized tutoring!'
            });
        }

        // Load transcript context
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const mod = course.modules[moduleIndex];
        const subtopic = mod?.subtopics[subtopicIndex];
        const transcript = subtopic?.transcript || '';
        const topicTitle = subtopic?.subtopic_title || 'this topic';

        // Build conversation for Gemini
        const systemPrompt = `You are a friendly, knowledgeable tutor helping a student learn about "${topicTitle}".

RULES:
1. Answer questions using the provided context as your primary knowledge base.
2. If the answer isn't in the context, use your general knowledge but mention that it goes beyond the main lesson.
3. Be concise — keep responses under 200 words unless the student asks for detail.
4. Use examples and analogies to explain complex concepts.
5. Be encouraging and supportive.
6. ALL responses MUST be in English only.
7. IMMERSION: NEVER use the word 'transcript' or 'video' in your responses. Instead of saying 'according to the transcript', just answer the question directly, or say 'in this lesson' or 'in this course'.

COURSE CONTEXT:
${transcript ? transcript.substring(0, 10000) : 'No context available for this topic.'}`;

        // Build message history for multi-turn
        const contents = [];
        
        // Add system instruction as first user turn
        contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nPlease acknowledge you are ready to help.' }] });
        contents.push({ role: 'model', parts: [{ text: 'I\'m ready to help you learn! Ask me anything about this topic.' }] });

        // Add conversation history
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }

        // Add current message
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });

        const reply = response.text || 'I\'m sorry, I couldn\'t generate a response. Please try again.';

        return res.json({
            success: true,
            reply: reply.trim()
        });

    } catch (error) {
        console.error('Tutor chat error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router;
