const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        let transcript = '';
        let topicTitle = '';
        let videoId = '';

        if (course.sourceType === 'playlist') {
            const day = course.days[moduleIndex];
            const video = day?.videos[subtopicIndex];
            transcript = video?.transcript || '';
            topicTitle = video?.title || 'this video';
            videoId = video?.videoId;
        } else {
            const mod = course.modules[moduleIndex];
            const subtopic = mod?.subtopics[subtopicIndex];
            transcript = subtopic?.transcript || '';
            topicTitle = subtopic?.subtopic_title || 'this topic';
            videoId = subtopic?.videoId;
        }

        // --- On-Demand Transcript Fetching (Fix for playlist courses) ---
        if (!transcript && videoId) {
            console.log(`🔍 AI Tutor: Missing transcript for video ${videoId}. Fetching on-demand...`);
            try {
                const { YoutubeTranscript } = require('../utils/youtubeTranscript');
                const result = await YoutubeTranscript.fetchTranscriptsBatch([videoId]);
                
                if (result.data && result.data[videoId]) {
                    const rawSegments = result.data[videoId];
                    
                    // --- FIX: Format array of segments into a single readable string ---
                    if (Array.isArray(rawSegments)) {
                        transcript = rawSegments.map(s => s.text).join(' ');
                    } else if (typeof rawSegments === 'string') {
                        transcript = rawSegments;
                    }
                    
                    // SAVE TO CACHE (Save back to DB for future use)
                    if (transcript) {
                        if (course.sourceType === 'playlist') {
                            course.days[moduleIndex].videos[subtopicIndex].transcript = transcript;
                        } else {
                            course.modules[moduleIndex].subtopics[subtopicIndex].transcript = transcript;
                        }
                        await course.save();
                        console.log(`✅ AI Tutor: Transcript cached successfully for ${videoId} (${transcript.length} chars)`);
                    }
                }
            } catch (err) {
                console.error(`⚠️ AI Tutor: Failed to fetch/save on-demand transcript for ${videoId}:`, err.message);
                // Non-fatal, we'll continue with no transcript context if fetching fails
            }
        }

        // Build conversation for Gemini
        const systemPrompt = `You are Lumina, a world-class AI tutor. You are strictly helping the student with the topic: "${topicTitle}".
        
        USE THE PROVIDED CONTENT BELOW (from the lecture transcript) as your primary source of truth.
        If the student asks something outside this content, relate it back to the course.
        
        RULES:
        1. Keep responses educational, encouraging, and clear.
        2. Use Markdown for formatting (bold, lists, etc).
        3. Match the language the student is using (Hindi/English).
        4. Tone: "Cool mentor" - professional but modern.
        5. IMMERSION: NEVER use 'transcript' or 'video'. Say 'this lesson'.

        LECTURE CONTENT:
        ${transcript ? transcript.substring(0, 10000) : 'No context available for this topic. Use general knowledge.'}`;

        // Initialize model (Using gemini-2.5-flash as per project standard)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Format history for Gemini chat
        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nPlease acknowledge you are Lumina and ready to help." }] },
                { role: 'model', parts: [{ text: "Hello! I am Lumina, your AI Tutor. I've reviewed the lesson for '" + topicTitle + "' and I'm ready to help! What's on your mind?" }] },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        return res.json({
            success: true,
            reply: aiResponse.trim()
        });

    } catch (error) {
        console.error('AI Tutor Chat Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router;
