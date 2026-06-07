require('dotenv').config();
const { generateGuidedSubtopicContent } = require('./src/services/guidedStudyGenerator');

async function testChallenge(courseTitle, topic, moduleTitle, subtopicTitle, language, configProps = {}) {
    console.log(`\n==================================================`);
    console.log(`Generating challenge for ${language.toUpperCase()}...`);
    console.log(`Course: ${courseTitle}`);
    console.log(`Topic: ${subtopicTitle}`);
    console.log(`==================================================`);

    try {
        const result = await generateGuidedSubtopicContent({
            courseTitle,
            topic,
            moduleTitle,
            subtopicTitle,
            subtopicType: "lesson",
            config: {
                level: "intermediate",
                explanationLength: "standard",
                miniProjectsEnabled: true,
                miniProjectMode: "independent",
                webGroundingEnabled: false,
                interactiveWidgets: true,
                mcqEnabled: false,
                codeEnabled: true,
                ...configProps
            },
            userPlan: "ultra"
        });

        const blocks = result.lessonContent?.blocks || [];
        let foundChallenge = null;

        for (const b of blocks) {
            if (b.inlineChallenge && b.inlineChallenge.type === 'interactive-code') {
                foundChallenge = b.inlineChallenge;
                break;
            }
        }

        if (foundChallenge) {
            console.log("✅ Success! Generated Challenge Details:");
            console.log(`Language: ${foundChallenge.language}`);
            console.log("----------------------------------");
            console.log("QUESTION:");
            console.log(foundChallenge.question);
            console.log("----------------------------------");
            console.log("CODE TEMPLATE:");
            console.log(foundChallenge.codeTemplate);
            console.log("----------------------------------");
            console.log("EXPECTED ANSWER:");
            console.log(JSON.stringify(foundChallenge.expectedAnswer));
            console.log("----------------------------------");
            console.log("HINT:");
            console.log(foundChallenge.hint);
        } else {
            console.log("❌ Failed: No interactive-code challenge found in blocks.");
            console.log("Blocks generated:", blocks.map(b => b.type));
        }
    } catch (err) {
        console.error("❌ Generation Error:", err.message);
    }
}

async function runAll() {
    // 3. Rust (rust) - Systems Programming
    await testChallenge(
        "Systems Programming with Rust",
        "Memory Safety and Borrowing",
        "Module 2: Smart Pointers",
        "2.3 Implementing a Custom Reference-Counted Box Wrapper",
        "rust"
    );
}

runAll();
