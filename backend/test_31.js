const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test31() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log("Testing gemini-3.1-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });
        const result = await model.generateContent("test");
        console.log("✅ Success with gemini-3.1-flash:", result.response.text());
    } catch (err) {
        console.error("❌ Failed with gemini-3.1-flash:", err.message);
    }
}

test31();
