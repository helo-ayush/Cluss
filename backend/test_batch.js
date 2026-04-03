const { YoutubeTranscript } = require('./src/utils/youtubeTranscript');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
    try {
        console.log("Testing batch transcripts...");
        const result = await YoutubeTranscript.fetchTranscriptsBatch(["dQw4w9WgXcQ", "g2o22C3CRfU", "INVALID_ID_HERE"]);
        console.log("Result received!");
        console.log("Keys:", Object.keys(result.data));
        
        for (const [vid, textArr] of Object.entries(result.data)) {
            if (textArr) {
                console.log(`Video ${vid}: Success - ${textArr.length} items`);
            } else {
                console.log(`Video ${vid}: No transcript found or disabled`);
            }
        }
    } catch(e) {
        console.error("Test failed:", e.message);
    }
})();
