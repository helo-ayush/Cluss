const axios = require('axios');
require('dotenv').config();

async function testApi() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    try {
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("Success with v1beta:", res.data);
    } catch (err) {
        console.error("Failed with v1beta:", err.response?.status, err.response?.data);
        
        try {
            console.log("Trying v1...");
            const urlV1 = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
            const resV1 = await axios.post(urlV1, {
                contents: [{ parts: [{ text: "Hello" }] }]
            });
            console.log("Success with v1:", resV1.data);
        } catch (errV1) {
            console.error("Failed with v1:", errV1.response?.status, errV1.response?.data);
        }
    }
}

testApi();
