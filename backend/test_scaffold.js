require('dotenv').config();
const { generateGuidedScaffold } = require('./src/services/guidedStudyGenerator');

async function run() {
    try {
        console.log("Testing generateGuidedScaffold for 'free' plan...");
        const resultFree = await generateGuidedScaffold({
            topic: "Introduction to React",
            syllabus: "",
            config: {
                goal: "Build web apps",
                level: "beginner",
                explanationLength: "standard",
                miniProjectsEnabled: true,
                miniProjectMode: "independent",
                webGroundingEnabled: false
            },
            userPlan: "free"
        });
        console.log("✅ Success with free plan! Title:", resultFree.course_title);
        console.log("Modules count:", resultFree.modules?.length);
    } catch (err) {
        console.error("❌ Failed with free plan:", err.message, err.stack);
    }

    try {
        console.log("\nTesting generateGuidedScaffold for 'ultra' plan...");
        const resultUltra = await generateGuidedScaffold({
            topic: "Introduction to React",
            syllabus: "",
            config: {
                goal: "Build web apps",
                level: "beginner",
                explanationLength: "standard",
                miniProjectsEnabled: true,
                miniProjectMode: "independent",
                webGroundingEnabled: false
            },
            userPlan: "ultra"
        });
        console.log("✅ Success with ultra plan! Title:", resultUltra.course_title);
        console.log("Modules count:", resultUltra.modules?.length);
    } catch (err) {
        console.error("❌ Failed with ultra plan:", err.message, err.stack);
    }
}

run();
