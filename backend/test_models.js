const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        // We can't easily list models with the SDK without knowing the method.
        // Let's try to just use 'gemini-1.5-flash' but maybe it's 'gemini-1.5-flash-latest'
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        for (const m of modelsToTry) {
            try {
                console.log(`Testing ${m}...`);
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`✅ Success with ${m}`);
                return m;
            } catch (err) {
                console.error(`❌ Failed with ${m}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

listModels();
