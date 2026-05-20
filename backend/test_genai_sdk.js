const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        console.log("Testing generateContent with @google/genai...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: 'Return a simple JSON object: {"status": "ok"}',
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        console.log("response typeof:", typeof response);
        console.log("response.text type:", typeof response.text);
        console.log("response.text value:", response.text);
        
        try {
            console.log("response.text() value:", await response.text());
        } catch (e) {
            console.log("response.text() failed:", e.message);
        }
        
    } catch (err) {
        console.error("SDK Error:", err.message, err.stack);
    }
}

run();
