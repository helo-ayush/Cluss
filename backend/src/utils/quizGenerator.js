const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Uses Gemini to generate a JSON array of quiz questions strictly from the given transcript.
 * @param {String} targetTopic - The topic of the subtopic
 * @param {String} transcript - The YouTube transcript text
 */
const generateQuizFromTranscript = async (targetTopic, transcript) => {
    // 1. If transcript is missing, we use a different prompt for a General Topic Quiz.
    const isGeneralQuiz = !transcript;
    const inputContent = isGeneralQuiz ? "No transcript available. Generate a high-quality quiz based on general knowledge of the topic." : transcript.substring(0, 15000);

    const prompt = `
    Create a multiple-choice quiz (3 to 6 questions) to test comprehension of the topic: '${targetTopic}'. 
    ${isGeneralQuiz 
        ? "Since no specific lecture transcript is available, generate excellent, standard questions that any student learning this topic should know." 
        : "The questions MUST be based STRICTLY on the facts in the provided transcript."}
    
    LANGUAGE RULE: ALL output — every question, every option, every explanation — MUST be written in English ONLY. Even if the content is in another language, you MUST translate and output exclusively in English.
    
    IMMERSION RULE: NEVER use the word "transcript" or "video". Instead, say "in this lecture" or "in this course".
    HINT RULE: The 'hint' MUST be a conceptual clue. NEVER say "Review the transcript". Give a real, helpful educational hint.
    
    Output ONLY a valid JSON array of objects:
    [
      {
        "question": "question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "Why A is correct",
        "hint": "Conceptual clue"
      }
    ]
    
    CONTENT TO USE:
    ${inputContent}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: prompt,
            config: {
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
