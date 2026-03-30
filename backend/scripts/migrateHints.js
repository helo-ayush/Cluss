require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    console.log("Starting Quiz Hint Migration...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const courses = await Course.find();
        let updatedCount = 0;

        for (const course of courses) {
            let courseChanged = false;
            for (const mod of course.modules) {
                for (const sub of mod.subtopics) {
                    if (sub.quiz && sub.quiz.length > 0) {
                        let needsHint = false;
                        for (const q of sub.quiz) {
                            if (!q.hint) needsHint = true;
                        }

                        if (needsHint) {
                            console.log(`Generating hints for: ${sub.subtopic_title} (Course: ${course.course_query})`);
                            
                            const prompt = `
                            For the following multiple choice questions, generate a subtle hint for each one based on general knowledge.
                            The hint should help the student without immediately revealing the exact answer.
                            Return ONLY a valid JSON array of STRINGS, exactly matching the length of the questions array.
                            
                            Questions:
                            ${JSON.stringify(sub.quiz.map(q => q.question))}
                            `;

                            try {
                                const response = await ai.models.generateContent({
                                    model: 'gemini-2.5-flash',
                                    contents: prompt,
                                    config: { responseMimeType: "application/json" }
                                });
                                
                                const hints = JSON.parse(response.text);
                                
                                if (Array.isArray(hints) && hints.length === sub.quiz.length) {
                                    sub.quiz.forEach((q, i) => {
                                        q.hint = hints[i] || "Review the material conceptually.";
                                    });
                                    courseChanged = true;
                                    updatedCount += sub.quiz.length;
                                    console.log(`  -> Successfully mapped ${hints.length} hints.`);
                                } else {
                                    console.log(`  -> Hint length mismatch or not array.`);
                                }
                            } catch(err) {
                                console.error(`Failed hints for ${sub.subtopic_title}`, err);
                            }
                        }
                    }
                }
            }
            
            if (courseChanged) {
                // Must mark arrays as modified in Mongoose to save changes inside nested documents
                course.markModified('modules');
                await course.save();
                console.log(`-> Saved hints for course: ${course.course_query}`);
            }
        }

        console.log(`\nMigration complete! Generated new hints for ${updatedCount} old questions.`);
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

run();
