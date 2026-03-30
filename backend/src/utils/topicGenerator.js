const express = require('express');
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

router.post('/', async (req, res) => {
    const query = req.body;

    const prompt = `Act as an expert curriculum designer and experienced professor. 
Your task is to break down the user's learning goal into a highly logical, sequential syllabus. 
Do not restrict the learning to "days". Instead, organize it into broad "Modules" and specific, bite-sized "Subtopics".

Learning Goal: "${query.query}"

CRITICAL INSTRUCTIONS:
1. You MUST output ONLY valid, parsable JSON.
2. Do NOT include any conversational text, introductions, or explanations.
3. Do NOT wrap the output in markdown code blocks (e.g., no \`\`\`json). Output the raw JSON object directly.
4. Each subtopic should include a highly optimized "youtube_search_query" that will yield the best tutorial videos for that specific concept.
5. LANGUAGE RULE: ALL output — course_title, module_title, subtopic_title, youtube_search_query — MUST be written in English ONLY. Even if the user's learning goal is in another language, translate everything and generate exclusively in English.

EXPECTED JSON SCHEMA:
{
  "course_title": "String (A catchy, accurate title for the course)",
  "modules": [
    {
      "module_id": "Integer (e.g., 1)",
      "module_title": "String (e.g., 'Basics of C++')",
      "subtopics": [
        {
          "subtopic_id": "Float/String (e.g., 1.1)",
          "subtopic_title": "String (e.g., 'Variables and Data Types')",
          "youtube_search_query": "String (e.g., 'C++ Variables and Data Types tutorial')"
        },
        {
          "subtopic_id": "Float/String (e.g., 1.2)",
          "subtopic_title": "String (e.g., 'If/Else Statements')",
          "youtube_search_query": "String (e.g., 'C++ If Else conditional statements tutorial')"
        }
      ]
    }
  ]
}

Generate the JSON syllabus for the Learning Goal now:`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();
        
        // Sanitize output to strip any markdown wrappers just in case
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(text));
    } catch (err) {
        console.error("Course Generation Error:", err);
        res.status(500).json({ error: "Failed to parse generated course plan." });
    }
});

module.exports = router;