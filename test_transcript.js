const { YoutubeTranscript } = require('c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\utils\\youtubeTranscript');

async function test() {
    const videoId = 'rHeaoaiBM6Y'; // Google Developers Intro to ML
    console.log(`Testing transcript for: ${videoId}`);
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (transcript && transcript.length > 0) {
            console.log(`✅ Success! Found ${transcript.length} lines.`);
            console.log(`Snippet: ${transcript[0].text}`);
        } else {
            console.log(`❌ Failed: Transcript array is empty or undefined.`);
        }
    } catch (err) {
        console.error(`❌ Error Object:`, err);
        console.error(`❌ Error Message:`, err.message);
    }
}

test();
