const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const mName = "gemini-3-flash-preview"; // or gemini-flash-latest
        console.log(`Testing ${mName}...`);
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await model.generateContent("test");
        console.log(`✅ Success with ${mName}`);
    } catch (err) {
        console.error(`❌ Failed with: ${err.message}`);
    }
}

test();
