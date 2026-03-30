const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini client (Make sure GEMINI_API_KEY is in your .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**`    
 * Evaluates a list of videos and returns the best one based on transcripts and stats.
 * * @param {Array} videos - Array of objects containing: videoId, title, viewCount, likeViewRatio, transcript
 * @param {String} targetTopic - The specific concept to learn (e.g., "C++ Variables")
 * @returns {Object|null} - Returns the winning video object, or null if all are rejected
 */
async function evaluateWithGemini(videos, targetTopic) {
    if (!videos || videos.length === 0) return null;

    // 1. Format the data to send to Gemini
    // We strip out unnecessary heavy data and just send what matters
    const evaluationPayload = videos.map(vid => ({
        videoId: vid.id,
        title: vid.title,
        viewCount: vid.viewCount,
        likeToViewRatio: vid.likeViewRatio.toFixed(4), // e.g., 0.0450
        // HACKATHON TIP: If transcripts are too long, slice the first 10,000 characters to evaluate just the intro/teaching style!
        transcriptSnippet: vid.transcript ? vid.transcript.substring(0, 10000) : "No transcript available."
    }));

    // 2. The Master Prompt
    const prompt = `
    You are an expert, highly critical university professor curating a curriculum.
    Your goal is to find the absolute best educational video to teach this specific topic: "${targetTopic}".

    I am providing you with a list of candidate videos in JSON format. Each contains stats and a transcript snippet.
    
    IMPORTANT: Some videos may not have transcripts available. In those cases, evaluate based on the **Title** and **Engagement Stats** (views/likes), but give preference to videos WITH transcripts as they are better for our automated quiz generation.

    EVALUATION CRITERIA (Out of 100 points total):
    1. Relevance (40 pts): Does the title or transcript suggest it actually teaches "${targetTopic}"?
    2. Teaching Quality (40 pts): Based on the transcript snippet (if available) or the channel's general reputation implied by stats, is this likely a high-quality explanation?
    3. Community Validation (20 pts): Consider the view count and the like-to-view ratio. A ratio above 0.03 (3%) is generally very good. High views indicate proven quality.

    INSTRUCTIONS:
    - Evaluate all candidates.
    - If a video has NO transcript, you can still score it based on title/stats, but cap its score at 80/100.
    - If a video HAS a high-quality transcript that perfectly matches the topic, reward it with a higher score.
    - If NONE of the videos score above 70/100, you must reject them all.
    - Output ONLY a valid JSON object.

    EXPECTED JSON OUTPUT FORMAT:
    {
        "winnerFound": boolean, // true if a video scored > 70, false if all rejected
        "winningVideoId": "string" | null, // The ID of the best video, or null
        "winningScore": number | null, // The score out of 100
        "reasoning": "string" // A brief 1-sentence explanation of why it won or why all failed
    }

    CANDIDATE VIDEOS:
    ${JSON.stringify(evaluationPayload, null, 2)}
    `;

    try {
        console.log(`Asking Gemini to evaluate ${videos.length} videos for topic: "${targetTopic}"...`);
        
        // Use Gemini 2.0 Flash for speed and intelligence
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: prompt,
            config: {
                // Enforce JSON output directly at the API level!
                responseMimeType: "application/json",
            }
        });

        // Parse the response
        const resultText = response.text;
        const resultData = JSON.parse(resultText);

        console.log(`Gemini Decision:`, resultData.reasoning);

        // 3. Process the Decision
        if (resultData.winnerFound && resultData.winningVideoId) {
            // Find the full original video object that matches the winning ID
            const winningVideo = videos.find(v => v.id === resultData.winningVideoId);
            
            if (winningVideo) {
                // Attach the Gemini score and reasoning for your database/frontend
                winningVideo.aiScore = resultData.winningScore;
                winningVideo.aiReasoning = resultData.reasoning;
                return winningVideo;
            } else {
                console.log(`⚠️ Gemini returned invalid videoId: ${resultData.winningVideoId}`);
                return null;
            }
        } else {
            // Gemini rejected everything (score < 70)
            console.log(`⚠️ Gemini rejected all candidates. Falling back to the best search result for continuity.`);
            const fallbackVideo = videos[0];
            fallbackVideo.aiScore = 0; // Indicate it's a fallback
            fallbackVideo.aiReasoning = "Automatic fallback: No video met the high-quality threshold.";
            return fallbackVideo;
        }

    } catch (error) {
        console.error("Gemini Evaluation Failed:", error);
        // Fallback: If AI fails due to limits/errors, just return the most viewed one to keep the app running during the demo
        return videos.length > 0 ? videos[0] : null; 
    }
}

module.exports = { evaluateWithGemini };