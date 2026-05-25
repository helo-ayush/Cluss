const { GoogleGenAI } = require('@google/genai');
const Flashcard = require('../models/Flashcard');
const Activity = require('../models/Activity');
const Course = require('../models/Course');
const { MODELS } = require('../config/creditConfig');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateFlashcardsForUser(userId) {
    try {
        // 1. Fetch recent activity (last 5 days) to find up to 3 unique courses
        const recentActivities = await Activity.find({ userId })
            .sort({ date: -1 })
            .limit(5);

        const uniqueCourseIds = new Set();
        recentActivities.forEach(activity => {
            if (activity.courses) {
                activity.courses.forEach(c => {
                    if (c.courseId) uniqueCourseIds.add(c.courseId.toString());
                });
            }
        });

        let courseIdsToFetch = Array.from(uniqueCourseIds).slice(0, 3);
        
        // Robust Fallback: If no recent activity found, fetch the user's actual courses directly!
        if (courseIdsToFetch.length === 0) {
            console.log(`No recent activity found for user ${userId}. Falling back to fetching courses directly.`);
            const userCourses = await Course.find({ userId }).sort({ updatedAt: -1 }).limit(3);
            courseIdsToFetch = userCourses.map(c => c._id.toString());
        }

        if (courseIdsToFetch.length === 0) {
            console.log(`No courses found for user ${userId}. Skipping flashcard generation.`);
            return [];
        }

        // 2. Fetch those courses and extract a lightweight outline
        const courses = await Course.find({ _id: { $in: courseIdsToFetch } });
        if (courses.length === 0) {
            console.log(`No matching course documents found in DB for user ${userId}.`);
            return [];
        }
        let combinedOutline = '';
        courses.forEach(course => {
            combinedOutline += `\nCourse: ${course.course_title}\n`;
            if (course.modules) {
                course.modules.forEach(mod => {
                    combinedOutline += `  Module: ${mod.module_title}\n`;
                    if (mod.subtopics) {
                        mod.subtopics.forEach(sub => {
                            combinedOutline += `    - ${sub.subtopic_title}\n`;
                        });
                    }
                });
            }
        });

        if (!combinedOutline.trim()) {
            console.log(`Generated outline is empty for user ${userId}. Skipping flashcard generation.`);
            return [];
        }

        // 3. Prompt AI to generate 10 flashcards based on the outline
        const systemPrompt = `You are an expert tutor creating spaced-repetition flashcards.
Based on the following topics the student has recently studied, generate exactly 10 flashcards.
The flashcards should cover the most important concepts, definitions, or facts from these topics.
Keep the front (question) clear and concise.
Keep the back (answer) short and direct.

OUTLINE:
${combinedOutline}

Requirements:
1. Return ONLY raw JSON in the exact format specified below. Do not use markdown blocks like \`\`\`json.
2. Format:
[
  {
    "front": "What is the primary function of...?",
    "back": "To do XYZ."
  }
]
`;

        const response = await ai.models.generateContent({
            model: MODELS.FREE_MODEL,
            contents: "Generate the flashcards now based on the outline.",
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.5,
                responseMimeType: 'application/json'
            }
        });

        let rawText = response.text || '';
        rawText = rawText.replace(/^```json/mi, '').replace(/```$/mi, '').trim();
        
        let generatedCards = [];
        try {
            generatedCards = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse flashcards JSON:", e);
            return [];
        }

        // We arbitrarily assign the first courseId as the reference for these cards
        const defaultCourseId = courseIdsToFetch[0];

        // 4. Save to DB
        const savedCards = [];
        for (const card of generatedCards) {
            const newCard = await Flashcard.create({
                userId,
                courseId: defaultCourseId,
                front: card.front,
                back: card.back
            });
            savedCards.push(newCard);
        }

        return savedCards;
    } catch (error) {
        console.error("Error generating flashcards:", error);
        return [];
    }
}

// SM-2 Algorithm Implementation
function calculateNextReview(card, grade) {
    // grade: 0-5 (0=Blackout, 1=Wrong, 2=Hard, 3=Good, 4=Easy, 5=Perfect)
    // We typically map UI buttons to: Hard=2, Good=4, Easy=5
    let { repetition, interval, easeFactor } = card;

    if (grade >= 3) {
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        repetition,
        interval,
        easeFactor,
        nextReviewDate
    };
}

module.exports = {
    generateFlashcardsForUser,
    calculateNextReview
};
