require('dotenv').config();
const { generateGuidedSubtopicContent } = require('./src/services/guidedStudyGenerator');

async function run() {
    try {
        console.log("Testing generateGuidedSubtopicContent for 'free' plan...");
        const resultFree = await generateGuidedSubtopicContent({
            courseTitle: "Introduction to React",
            topic: "Introduction to React",
            moduleTitle: "Module 1: React Basics",
            subtopicTitle: "1.1 What is React?",
            subtopicType: "lesson",
            config: {
                level: "beginner",
                explanationLength: "standard",
                miniProjectsEnabled: true,
                miniProjectMode: "independent",
                webGroundingEnabled: false,
                interactiveWidgets: true
            },
            userPlan: "free"
        });
        console.log("✅ Success with free plan! Overview length:", resultFree.lessonContent?.overview?.length);
        console.log("Blocks count:", resultFree.lessonContent?.blocks?.length);
    } catch (err) {
        console.error("❌ Failed with free plan:", err.message, err.stack);
    }

    try {
        console.log("\nTesting generateGuidedSubtopicContent for 'ultra' plan...");
        const resultUltra = await generateGuidedSubtopicContent({
            courseTitle: "Introduction to React",
            topic: "Introduction to React",
            moduleTitle: "Module 1: React Basics",
            subtopicTitle: "1.1 What is React?",
            subtopicType: "lesson",
            config: {
                level: "beginner",
                explanationLength: "standard",
                miniProjectsEnabled: true,
                miniProjectMode: "independent",
                webGroundingEnabled: false,
                interactiveWidgets: true
            },
            userPlan: "ultra"
        });
        console.log("✅ Success with ultra plan! Overview length:", resultUltra.lessonContent?.overview?.length);
        console.log("Blocks count:", resultUltra.lessonContent?.blocks?.length);
    } catch (err) {
        console.error("❌ Failed with ultra plan:", err.message, err.stack);
    }
}

run();
