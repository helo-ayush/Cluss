const { execFile } = require('child_process');
const path = require('path');

class YoutubeTranscriptError extends Error {
    constructor(message) {
        super(`[YoutubeTranscript] 🚨 ${message}`);
    }
}

class YoutubeTranscript {
    static retrieveVideoId(url) {
        if (url.length === 11) return url;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (match && match[1]) return match[1];
        throw new YoutubeTranscriptError('Impossible to retrieve Youtube video ID.');
    }

    /**
     * Executes the Python script to fetch the transcript.
     * Tries 'python' first, then 'python3' if it fails (useful for Render/Linux environments).
     */
    static async fetchTranscript(videoIdOrUrl) {
        const videoId = this.retrieveVideoId(videoIdOrUrl);

        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'get_transcript.py');
            const pythonExecutables = process.env.PYTHON_EXEC ? [process.env.PYTHON_EXEC] : ['python', 'python3'];
            
            console.log(`Fetching transcript via Python script for ${videoId}...`);
            
            const tryPython = (execIndex) => {
                if (execIndex >= pythonExecutables.length) {
                    return reject(new YoutubeTranscriptError('Python script failed to retrieve the transcript.'));
                }
                const pythonExecutable = pythonExecutables[execIndex];
                
                execFile(pythonExecutable, [scriptPath, videoId], (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[YoutubeTranscript] Python script error with '${pythonExecutable}' for ${videoId}:`, error.message);
                        return tryPython(execIndex + 1); // Try the next executable
                    }
                    
                    try {
                        const data = JSON.parse(stdout);
                        if (data.error) {
                            console.error(`[YoutubeTranscript] Python script returned error for ${videoId}:`, data.error);
                            return reject(new YoutubeTranscriptError(data.error));
                        }
                        if (Array.isArray(data) && data.length > 0) {
                            return resolve(data);
                        }
                        reject(new YoutubeTranscriptError('Transcript array is empty or invalid.'));
                    } catch (parseError) {
                        console.error(`[YoutubeTranscript] Failed to parse Python script output for ${videoId}:`, parseError.message);
                        reject(new YoutubeTranscriptError('Failed to parse Python script output.'));
                    }
                });
            };

            tryPython(0);
        });
    }
}

module.exports = {
    YoutubeTranscript,
    YoutubeTranscriptError
};