const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Uses Gemini to generate a JSON array of quiz questions strictly from the given transcript.
 * @param {String} targetTopic - The topic of the subtopic
 * @param {String} transcript - The YouTube transcript text
 */
const generateQuizFromTranscript = async (targetTopic, transcript) => {
    if (!transcript) return null;
    
    // Constraint 1: Truncate transcript to first 15k chars to save tokens
    const limitedTranscript = transcript.substring(0, 15000);

    const prompt = `
    Create a multiple-choice quiz (3 to 6 questions) to test comprehension of the topic: '${targetTopic}'. 
    The questions MUST be based STRICTLY on the facts in the provided transcript. 
    
    LANGUAGE RULE: ALL output — every question, every option, every explanation — MUST be written in English ONLY. Even if the transcript is in another language (Hindi, Spanish, Japanese, etc.), you MUST translate all content and generate everything exclusively in English. No exceptions.
    
    IMMERSION RULE: NEVER use the word "transcript" or "video" in your questions, options, explanations, or hints. Instead of saying "according to the transcript", just ask the question directly, or say "in this lecture" or "in this course".
    HINT RULE: The 'hint' MUST be a conceptual clue to help them think about the answer. NEVER say "Review the transcript" or "It is mentioned early on". Give a real, helpful educational hint.
    
    Output ONLY a valid JSON array of objects matching this exact structure:
    [
      {
        "question": "What is the primary function of...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "explanation": "Option B is correct because...",
        "hint": "A helpful educational clue that guides the student closer to the answer without revealing it directly."
      }
    ]
    
    CRITICAL: The 'correctAnswer' string MUST be an exact, character-for-character match with one of the strings in the 'options' array. This is required so the frontend can check the user's answer directly without needing an AI.
    
    TRANSCRIPT:
    ${limitedTranscript}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Constraint 2: Use 2.5-flash
            contents: prompt,
            config: {
                // Constraint 2: Force strict JSON output
                responseMimeType: "application/json",
            }
        });

        const resultText = response.text;
        const resultData = JSON.parse(resultText);
        return resultData;
    } catch (error) {
        console.error("Quiz Generation Failed:", error);
        return null;
    }
};

module.exports = { generateQuizFromTranscript };
