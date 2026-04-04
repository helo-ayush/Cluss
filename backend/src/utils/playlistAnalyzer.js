const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes a playlist's video titles to categorize them into topic blocks
 * and identify outdated topics. (FREE — single Gemini call)
 *
 * @param {string[]} videoTitles - Array of video titles in playlist order
 * @param {string} courseTitle - The playlist/course title
 * @returns {Object} { topicBlocks: [...] }
 */
async function analyzePlaylistTopics(videoTitles, courseTitle) {
    const prompt = `
You are a senior technology curriculum auditor with deep knowledge of industry trends in 2025-2026.

A student has imported a YouTube playlist titled "${courseTitle}" to learn from.
Below are ALL video titles in the playlist, in order.

Your task:
1. Group these videos into logical TOPIC BLOCKS (e.g., "MongoDB", "Express.js Routing", "HTML Basics").
   Each topic should be a coherent learning unit — NOT individual video groupings.
2. For each topic block, mark whether it is OUTDATED or still relevant.
3. A topic is "outdated" if it teaches a technology, framework, or practice that has been largely superseded 
   or is no longer recommended in modern industry practice (e.g., jQuery UI, PHP 5, Dreamweaver, Flash, 
   Angular.js v1, Bower, var-only JavaScript, etc.)
4. For each outdated topic, give a brief 1-sentence reason WHY it's outdated.

VIDEO TITLES (indexed):
${videoTitles.map((t, i) => `[${i}] ${t}`).join('\n')}

Output ONLY valid JSON in this exact format:
{
  "topicBlocks": [
    {
      "topicName": "Topic Name Here",
      "videoIndices": [0, 1, 2],
      "isOutdated": false,
      "reason": ""
    },
    {
      "topicName": "jQuery",
      "videoIndices": [15, 16, 17],
      "isOutdated": true,
      "reason": "jQuery is largely replaced by modern frameworks like React and Vue"
    }
  ]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);
        console.log(`🔍 Topic analysis complete: ${result.topicBlocks?.length || 0} blocks found`);
        return result;
    } catch (error) {
        console.error('❌ Topic analysis failed:', error.message);
        throw new Error('Failed to analyze playlist topics: ' + error.message);
    }
}

/**
 * Suggests trending/missing topics for a course. (PRO ONLY — single Gemini call)
 *
 * @param {string} courseTitle - The playlist/course title  
 * @param {Object[]} existingTopicBlocks - Current topic blocks from analyzePlaylistTopics
 * @returns {Object} { missingSuggestions: [...] }
 */
async function suggestMissingTopics(courseTitle, existingTopicBlocks) {
    const existingTopicNames = existingTopicBlocks.map(t => t.topicName).join(', ');

    const prompt = `
You are a senior technology career advisor and curriculum designer with deep knowledge of the 2025-2026 job market.

A student is learning "${courseTitle}".

Their current curriculum already covers these topics:
${existingTopicNames}

Your task:
1. Analyze what CRITICAL, IN-DEMAND, or TRENDING topics are MISSING from this curriculum 
   that a modern professional would absolutely need.
2. Focus on what's actually trending in the job market RIGHT NOW (2025-2026).
3. Be specific and practical. For a "Web Development" course, suggest things like 
   "TypeScript", "Prisma ORM", "Docker Basics" — NOT vague things like "Best Practices".
4. For each missing topic, provide 2-3 specific subtopics with YouTube search queries 
   that would find the BEST tutorial videos.
5. Suggest 3-8 topics maximum. Quality over quantity.

IMPORTANT RULES:
- Do NOT suggest topics already covered (${existingTopicNames})
- Each suggestion should be a SEPARATE topic, not an extension of existing ones
- Subtopic YouTube queries should be specific and include the year for freshness

Output ONLY valid JSON:
{
  "missingSuggestions": [
    {
      "topicName": "TypeScript",
      "reason": "TypeScript is now required in 85%+ of frontend job postings and most modern React projects",
      "subtopics": [
        { "title": "TypeScript Fundamentals", "youtubeQuery": "TypeScript complete tutorial 2025 beginners" },
        { "title": "TypeScript with React", "youtubeQuery": "TypeScript React project tutorial 2025" }
      ]
    }
  ]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);
        console.log(`🔮 Missing topics analysis: ${result.missingSuggestions?.length || 0} suggestions`);
        return result;
    } catch (error) {
        console.error('❌ Missing topics analysis failed:', error.message);
        throw new Error('Failed to suggest missing topics: ' + error.message);
    }
}

module.exports = { analyzePlaylistTopics, suggestMissingTopics };
