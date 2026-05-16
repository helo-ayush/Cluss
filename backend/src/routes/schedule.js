const express = require('express');
const router = express.Router();
const DailySchedule = require('../models/DailySchedule');
const Course = require('../models/Course');
const User = require('../models/User');
const { GoogleGenAI } = require('@google/genai');
const { MODELS } = require('../config/creditConfig');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * GET /api/schedule/daily/:clerkId
 * Retrieves today's schedule, or generates a new one if it doesn't exist.
 */
router.get('/daily/:clerkId', async (req, res) => {
    try {
        const { clerkId } = req.params;
        
        // Use YYYY-MM-DD based on local server time, or UTC
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Check if schedule exists for today
        const existing = await DailySchedule.findOne({ clerkId, date: todayStr });
        if (existing) {
            return res.json({ success: true, schedule: existing });
        }

        // Fetch User first to get ObjectId
        const user = await User.findOne({ clerkId });
        if (!user) {
            console.log('User not found for clerkId:', clerkId);
            return res.json({ success: false, message: 'User not found' });
        }

        console.log(`Found user: ${user._id} for clerkId: ${clerkId}`);

        // 2. Schedule doesn't exist for today. Let's gather data to generate one.
        const activeCourses = await Course.find({ 
            userId: user._id, 
            sourceType: { $in: ['guided-topic', 'playlist'] } 
        });

        console.log(`Found ${activeCourses.length} active courses for user ${user._id}`);
        
        // Handle empty state (No active courses)
        if (!activeCourses || activeCourses.length === 0) {
            const emptySchedule = new DailySchedule({
                clerkId,
                date: todayStr,
                greeting: "Welcome! You don't have any active courses right now.",
                plan: [
                    {
                        courseName: "System",
                        courseId: "000000000000000000000000",
                        topicToLearn: "Create a new course",
                        reason: "Kickstart your learning journey today by generating a new guided plan or playlist."
                    }
                ]
            });
            await emptySchedule.save();
            return res.json({ success: true, schedule: emptySchedule });
        }

        // 3. Extract the 'next available' subtopics across active courses
        const coursesData = [];
        activeCourses.forEach(course => {
            let lastCompleted = null;
            let uncompletedTopics = [];
            
            if (course.modules) {
                for (const mod of course.modules) {
                    if (mod.subtopics) {
                        for (const sub of mod.subtopics) {
                            if (sub.status === 'completed') {
                                lastCompleted = sub.subtopic_title;
                            } else {
                                if (uncompletedTopics.length < 5) {
                                    uncompletedTopics.push(sub.subtopic_title);
                                }
                            }
                        }
                    }
                }
            }
            
            if (uncompletedTopics.length > 0) {
                const msSince = Date.now() - new Date(course.updatedAt || course.createdAt).getTime();
                const daysSince = Math.floor(msSince / (1000 * 60 * 60 * 24));
                
                coursesData.push({
                    courseId: course._id.toString(),
                    name: course.course_title,
                    daysSinceLastStudy: daysSince,
                    lastCompletedTopic: lastCompleted || "None yet",
                    availableUpcomingTopics: uncompletedTopics
                });
            }
        });

        // If all courses are actually completed, treat as empty
        if (coursesData.length === 0) {
             const emptySchedule = new DailySchedule({
                clerkId,
                date: todayStr,
                greeting: "You've completed all your active courses! Amazing job.",
                plan: [
                    {
                        courseName: "System",
                        courseId: "000000000000000000000000",
                        topicToLearn: "Start something new",
                        reason: "You have no active topics left. Time to dive into a new subject!"
                    }
                ]
            });
            await emptySchedule.save();
            return res.json({ success: true, schedule: emptySchedule });
        }

        // 4. Send to Gemini
        const prompt = `
You are an expert AI Study Director.
Your goal is to suggest a daily study schedule of EXACTLY 5 topics total across the user's active courses.

Rules for prioritizing:
1. Momentum: If a course was studied very recently (0-1 days ago), assign multiple sequential topics from its 'availableUpcomingTopics' list (e.g. 2 or 3 topics from the same course).
2. Interleaving: Assign at least 1 topic from a course they haven't touched in a while (e.g., >2 days ago) if available, to keep their memory fresh.
3. Total sum: You MUST select exactly 5 topics in total (unless there are fewer than 5 topics available across all courses combined).
4. Order matters: If you select multiple topics from the same course, list them in the exact chronological order they appear in the 'availableUpcomingTopics' array.
5. ONLY choose from the 'availableUpcomingTopics' strings provided below. Do not invent topics.

Data:
${JSON.stringify(coursesData, null, 2)}

Return a JSON object in EXACTLY this format:
{
  "greeting": "A short, motivating 1-2 sentence greeting.",
  "plan": [
    {
      "courseId": "String (Must exactly match the courseId from the data)",
      "courseName": "String",
      "topicToLearn": "String (Must exactly match one of the availableUpcomingTopics)",
      "reason": "Short 1-sentence reason why you picked this today."
    }
  ]
}
`;

        const response = await ai.models.generateContent({
            model: MODELS.FREE_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let parsed;
        try {
            parsed = JSON.parse(response.text);
        } catch (e) {
            console.error("Failed to parse Gemini schedule:", e);
            throw new Error("Invalid AI response");
        }

        // Validate structure safely
        const planItems = Array.isArray(parsed.plan) ? parsed.plan : [];
        const validatedPlan = planItems.map(item => ({
            courseName: item.courseName || "Unknown Course",
            courseId: item.courseId || activeCourses[0]._id.toString(), // fallback
            topicToLearn: item.topicToLearn || "Next Topic",
            reason: item.reason || "Recommended for today."
        })).slice(0, 5); // Max 5

        const newSchedule = new DailySchedule({
            clerkId,
            date: todayStr,
            greeting: parsed.greeting || "Here is your plan for today!",
            plan: validatedPlan
        });

        await newSchedule.save();
        return res.json({ success: true, schedule: newSchedule });

    } catch (err) {
        console.error('Error fetching/generating daily schedule:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
