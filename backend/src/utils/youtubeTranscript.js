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
            
            // Look for local venv python first, then fallbacks
            const venvPath = path.join(__dirname, '..', '..', '.venv');
            const localPythonLinux = path.join(venvPath, 'bin', 'python');
            const localPythonWin = path.join(venvPath, 'Scripts', 'python.exe');
            
            const pythonExecutables = process.env.PYTHON_EXEC 
                ? [process.env.PYTHON_EXEC] 
                : [localPythonLinux, localPythonWin, 'python3', 'python'];
            
            console.log(`Fetching transcript via Python script for ${videoId}...`);
            
            const tryPython = (execIndex, lastError = null) => {
                if (execIndex >= pythonExecutables.length) {
                    const errMsg = lastError ? `Python script failed: ${lastError.message}` : 'Python script failed to retrieve the transcript.';
                    return reject(new YoutubeTranscriptError(errMsg));
                }
                const pythonExecutable = pythonExecutables[execIndex];
                
                execFile(pythonExecutable, [scriptPath, videoId], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                    // Even if error is truthy (e.g., exit code 1), check stdout first
                    // because our python script outputs JSON with {"error": ...} on failure.
                    if (stdout) {
                        try {
                            const data = JSON.parse(stdout);
                            if (data.error) {
                                console.error(`[YoutubeTranscript] Python script returned error for ${videoId}:`, data.error);
                                return reject(new YoutubeTranscriptError(data.error));
                            }
                            if (Array.isArray(data) && data.length > 0) {
                                return resolve(data);
                            }
                        } catch (parseError) {
                            // ignore parse error here, fall through to error handling
                        }
                    }

                    if (error) {
                        console.error(`[YoutubeTranscript] Python script error with '${pythonExecutable}' for ${videoId}:`, error.message);
                        if (stderr) console.error(`[YoutubeTranscript] stderr for ${videoId}:`, stderr);
                        return tryPython(execIndex + 1, error); // Try the next executable
                    }
                    
                    if (stderr) console.warn(`[YoutubeTranscript] Python script warning for ${videoId}:`, stderr);
                    
                    reject(new YoutubeTranscriptError('Transcript array is empty or invalid.'));
                });
            };

            tryPython(0, null);
        });
    }
}

module.exports = {
    YoutubeTranscript,
    YoutubeTranscriptError
};