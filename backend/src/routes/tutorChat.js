const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const PublishedCourse = require('../models/PublishedCourse');
const ChatSession = require('../models/ChatSession');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { checkCredits } = require('../middleware/creditManager');
const { spendCredits } = require('../middleware/creditManager');
const { getModelForPlan } = require('../config/creditConfig');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildSessionTitle = (message = '') => {
    const cleaned = message.replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'New chat';
    return cleaned.length > 52 ? `${cleaned.slice(0, 52)}...` : cleaned;
};

router.get('/sessions', async (req, res) => {
    try {
        const { clerkId } = req.query;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });

        const sessions = await ChatSession.find({ clerkId })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select('_id title updatedAt messages');

        return res.json({
            success: true,
            sessions: sessions.map((session) => ({
                _id: session._id,
                title: session.title,
                updatedAt: session.updatedAt,
                preview: session.messages?.at(-1)?.text || ''
            }))
        });
    } catch (error) {
        console.error('Chat sessions fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load chat history' });
    }
});

router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const { clerkId } = req.query;
        const { sessionId } = req.params;
        if (!clerkId) return res.status(400).json({ success: false, message: 'clerkId is required' });

        const session = await ChatSession.findOne({ _id: sessionId, clerkId });
        if (!session) return res.status(404).json({ success: false, message: 'Chat not found' });

        return res.json({ success: true, session });
    } catch (error) {
        console.error('Chat session fetch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load chat' });
    }
});

/**
 * POST /api/tutor-chat
 * AI Tutor Chat.
 * Accepts: { clerkId, courseId, moduleIndex, subtopicIndex, message, history[] }
 * Returns: { success, reply }
 */
router.post('/', checkCredits('tutorChat'), async (req, res) => {
    try {
        const { clerkId, courseId, publicCourseId, moduleIndex, subtopicIndex, message, history, contextBlock, explainMode, sessionId, linkedCourseId } = req.body;

        if (!clerkId || !message) {
            return res.status(400).json({ success: false, message: 'clerkId and message are required' });
        }

        // Check User plan
        const user = req.dbUser || await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (publicCourseId && user.plan === 'free') {
            return res.status(403).json({
                success: false,
                message: 'AI tutor chat for public courses is available on Pro and Ultra plans.'
            });
        }

        const course = courseId ? await Course.findById(courseId) : null;
        if (courseId && !course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const publicCourse = publicCourseId ? await PublishedCourse.findById(publicCourseId).lean() : null;
        if (publicCourseId && !publicCourse) {
            return res.status(404).json({ success: false, message: 'Published course not found' });
        }

        let transcript = '';
        let topicTitle = '';
        let videoId = '';

        if (publicCourse) {
            const mod = publicCourse.modules?.[moduleIndex];
            const subtopic = mod?.subtopics?.[subtopicIndex];
            const lesson = subtopic?.lessonContent || {};
            if (contextBlock?.body || contextBlock?.title || contextBlock?.code) {
                transcript = [
                    `Selected block title: ${contextBlock.title || 'Selected lesson block'}`,
                    contextBlock.body || '',
                    contextBlock.code ? `Code:\n${contextBlock.code}` : '',
                    contextBlock.blockSummary ? `Block summary: ${contextBlock.blockSummary}` : '',
                    lesson.summary ? `Lesson summary: ${lesson.summary}` : '',
                    Array.isArray(lesson.keyPoints) ? `Key points:\n${lesson.keyPoints.join('\n')}` : ''
                ].filter(Boolean).join('\n\n');
            } else {
                const blockText = Array.isArray(lesson.blocks)
                    ? lesson.blocks.map((block) => `${block.title}\n${block.body}\n${block.code || ''}`).join('\n\n')
                    : '';
                transcript = [
                    blockText,
                    lesson.overview,
                    lesson.explanation,
                    lesson.example,
                    lesson.summary,
                    Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : '',
                    subtopic?.tutorContextSummary || ''
                ].filter(Boolean).join('\n\n');
            }
            topicTitle = subtopic?.subtopic_title || publicCourse.title || 'this public course';
        } else if (!course) {
            topicTitle = 'general study support';
            transcript = [
                'The student opened the global dashboard tutor, not a specific lesson.',
                'Help them study, plan, debug confusion, make examples, create revision prompts, or break topics down.',
                'Do not claim access to a course unless the student provides details.'
            ].join('\n');
        } else if (course.sourceType === 'playlist') {
            const day = course.days[moduleIndex];
            const video = day?.videos[subtopicIndex];
            transcript = video?.transcript || '';
            topicTitle = video?.title || 'this video';
            videoId = video?.videoId;
        } else if (course.sourceType === 'guided-topic') {
            const mod = course.modules[moduleIndex];
            const subtopic = mod?.subtopics[subtopicIndex];
            const lesson = subtopic?.lessonContent || {};
            if (contextBlock?.body || contextBlock?.title || contextBlock?.code) {
                transcript = [
                    `Selected block title: ${contextBlock.title || 'Selected lesson block'}`,
                    contextBlock.body || '',
                    contextBlock.code ? `Code:\n${contextBlock.code}` : '',
                    contextBlock.blockSummary ? `Block summary: ${contextBlock.blockSummary}` : '',
                    lesson.summary ? `Lesson summary: ${lesson.summary}` : '',
                    Array.isArray(lesson.keyPoints) ? `Key points:\n${lesson.keyPoints.join('\n')}` : ''
                ].filter(Boolean).join('\n\n');
            } else {
                const blockText = Array.isArray(lesson.blocks)
                    ? lesson.blocks.map((block) => `${block.title}\n${block.body}\n${block.code || ''}`).join('\n\n')
                    : '';
                transcript = [
                    blockText,
                    lesson.overview,
                    lesson.explanation,
                    lesson.example,
                    lesson.summary,
                    Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : '',
                    subtopic?.tutorContextSummary || ''
                ].filter(Boolean).join('\n\n');
            }
            topicTitle = subtopic?.subtopic_title || 'this topic';
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
        const contextFocus = contextBlock?.title ? `The student selected this specific note block: "${contextBlock.title}". Prioritize that block before the wider lesson.` : 'The student is asking about the current lesson.';
        const modeFocus = explainMode ? `Requested tutor mode: ${explainMode}.` : '';

        const systemPrompt = `You are Cluss, a world-class AI tutor. You are strictly helping the student with the topic: "${topicTitle}".
        
        USE THE PROVIDED CONTENT BELOW (from the lecture transcript) as your primary source of truth.
        If the student asks something outside this content, relate it back to the course.
        ${contextFocus}
        ${modeFocus}
        
        RULES:
        1. Keep responses educational, encouraging, and clear.
        2. Use Markdown for formatting (bold, lists, etc).
        3. Match the language the student is using (Hindi/English).
        4. Tone: patient big-bro tutor: simple, warm, concrete, never condescending.
        5. Start from basics when the student sounds confused.
        6. IMMERSION: NEVER use 'transcript' or 'video'. Say 'this lesson'.

        LECTURE CONTENT:
        ${transcript ? transcript.substring(0, 10000) : 'No context available for this topic. Use general knowledge.'}`;

        // Initialize model — route to plan-appropriate model
        const geminiModel = getModelForPlan(user.plan);
        const model = genAI.getGenerativeModel({ model: geminiModel });

        // Format history for Gemini chat
        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nPlease acknowledge you are Cluss and ready to help." }] },
                { role: 'model', parts: [{ text: "Hello! I am Cluss, your AI Tutor. I've reviewed the lesson for '" + topicTitle + "' and I'm ready to help! What's on your mind?" }] },
                ...chatHistory
            ]
        });

        // Deduct credits
        await spendCredits(user, 'tutorChat');

        let savedSession = null;
        if (!courseId) {
            savedSession = sessionId
                ? await ChatSession.findOne({ _id: sessionId, clerkId })
                : null;

            if (!savedSession) {
                savedSession = new ChatSession({
                    clerkId,
                    title: buildSessionTitle(message),
                    linkedCourseId: linkedCourseId || null,
                    messages: [{ role: 'user', text: message }]
                });
                await savedSession.save(); // Save immediately so it appears in Recent
            } else {
                savedSession.messages.push({ role: 'user', text: message });
                await savedSession.save();
            }
        }

        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        // Append AI response and save again
        if (savedSession) {
            savedSession.messages.push({ role: 'assistant', text: aiResponse.trim() });
            savedSession.messages = savedSession.messages.slice(-80);
            if (!savedSession.title || savedSession.title === 'New chat') {
                savedSession.title = buildSessionTitle(message);
            }
            await savedSession.save();

            const oldSessions = await ChatSession.find({ clerkId })
                .sort({ updatedAt: -1 })
                .skip(50)
                .select('_id');
            if (oldSessions.length > 0) {
                await ChatSession.deleteMany({ _id: { $in: oldSessions.map((session) => session._id) } });
            }
        }

        return res.json({
            success: true,
            reply: aiResponse.trim(),
            sessionId: savedSession?._id || null,
            title: savedSession?.title || null,
            linkedCourseId: savedSession?.linkedCourseId || null
        });

    } catch (error) {
        console.error('AI Tutor Chat Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Internal server error'
        });
    }
});

module.exports = router;
