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

    static async fetchTranscriptsBatch(videoIds) {
        if (!videoIds || videoIds.length === 0) return { data: {} };

        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'get_transcript.py');
            
            const venvPath = path.join(__dirname, '..', '..', '.venv');
            const localPythonLinux = path.join(venvPath, 'bin', 'python');
            const localPythonWin = path.join(venvPath, 'Scripts', 'python.exe');
            
            const pythonExecutables = process.env.PYTHON_EXEC 
                ? [process.env.PYTHON_EXEC] 
                : [localPythonLinux, localPythonWin, 'python3', 'python'];
            
            console.log(`Fetching ${videoIds.length} transcripts via one Python process...`);
            
            const tryPython = (execIndex, lastError = null) => {
                if (execIndex >= pythonExecutables.length) {
                    const errMsg = lastError ? `Python script failed: ${lastError.message}` : 'Python script failed to retrieve transcripts.';
                    return reject(new YoutubeTranscriptError(errMsg));
                }
                const pythonExecutable = pythonExecutables[execIndex];
                
                execFile(pythonExecutable, [scriptPath, ...videoIds], { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
                    if (stdout) {
                        try {
                            const data = JSON.parse(stdout);
                            if (data.error) {
                                console.error(`[YoutubeTranscript] Python script returned error:`, data.error);
                                return reject(new YoutubeTranscriptError(data.error));
                            }
                            if (data.data) {
                                return resolve(data);
                            }
                        } catch (parseError) {}
                    }

                    if (error) {
                        return tryPython(execIndex + 1, error);
                    }
                    
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