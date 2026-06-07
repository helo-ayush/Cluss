const axios = require('axios');

class CompilerManager {
    constructor() {
        // Collect configured compiler URLs from environment variables
        const urls = [
            process.env.COMPILER_URL1,
            process.env.COMPILER_URL2,
            process.env.COMPILER_URL3
        ].filter(url => url && url.trim().length > 0);

        // Fallback to COMPILER_URLS comma-separated list
        if (urls.length === 0 && process.env.COMPILER_URLS) {
            const splitUrls = process.env.COMPILER_URLS.split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
            urls.push(...splitUrls);
        }

        // Fallback to localhost default for development
        if (urls.length === 0) {
            urls.push('http://localhost:7860');
        }

        this.compilerUrls = urls;
        
        // Initialize active request counter for each compiler URL
        this.activeRequests = {};
        this.compilerUrls.forEach(url => {
            this.activeRequests[url] = 0;
        });

        // Queue config
        this.queue = [];
        this.MAX_CONCURRENT_PER_INSTANCE = 3; // soft capacity limit
        this.HARD_CAP_PER_INSTANCE = 5;       // hard limit
        this.MAX_QUEUE_SIZE = 50;
        this.QUEUE_TIMEOUT_MS = 15000;         // 15 seconds queue timeout

        console.log(`[CompilerManager] Initialized with compiler instances:`, this.compilerUrls);
    }

    async runCode(code, language, timeout = 3.0) {
        // Find best compiler instance
        const bestUrl = this.getBestInstance();

        // If all instances are at or above soft limit, or queue is active, we must queue
        if (!bestUrl || this.activeRequests[bestUrl] >= this.MAX_CONCURRENT_PER_INSTANCE) {
            if (this.queue.length >= this.MAX_QUEUE_SIZE) {
                throw new Error("Compile server is currently overloaded. Please try again in a moment.");
            }

            console.log(`[CompilerManager] All instances busy. Enqueuing task. Queue size: ${this.queue.length + 1}`);
            return new Promise((resolve, reject) => {
                this.queue.push({
                    code,
                    language,
                    timeout,
                    resolve,
                    reject,
                    queuedAt: Date.now()
                });
            });
        }

        // Dispatch immediately
        return this.executeOnInstance(bestUrl, code, language, timeout);
    }

    getBestInstance() {
        let bestUrl = null;
        let minRequests = Infinity;

        for (const url of this.compilerUrls) {
            const count = this.activeRequests[url] || 0;
            // Check hard cap - if at or above hard cap, we never send requests
            if (count >= this.HARD_CAP_PER_INSTANCE) {
                continue;
            }
            if (count < minRequests) {
                minRequests = count;
                bestUrl = url;
            }
        }

        return bestUrl;
    }

    async executeOnInstance(url, code, language, timeout) {
        this.activeRequests[url] = (this.activeRequests[url] || 0) + 1;
        console.log(`[CompilerManager] Dispatching task to ${url}. Active count: ${this.activeRequests[url]}`);

        try {
            // Setup a longer timeout for HF Spaces to allow cold starts (30s timeout)
            const response = await axios.post(`${url}/compile`, {
                code,
                language,
                timeout
            }, {
                timeout: 30000, 
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error(`[CompilerManager] Error on instance ${url}:`, error.message);
            
            // Return a structured error response similar to compiler outputs
            return {
                stdout: "",
                stderr: error.response?.data?.detail || `Network error connecting to compilation server: ${error.message}`,
                exit_code: -1,
                execution_time: 0.0
            };
        } finally {
            this.activeRequests[url] = Math.max(0, (this.activeRequests[url] || 0) - 1);
            console.log(`[CompilerManager] Task finished on ${url}. Remaining active: ${this.activeRequests[url]}`);
            
            // Trigger next queue item processing
            this.processQueue();
        }
    }

    processQueue() {
        if (this.queue.length === 0) return;

        // Clean up expired tasks in the queue first
        const now = Date.now();
        while (this.queue.length > 0 && (now - this.queue[0].queuedAt > this.QUEUE_TIMEOUT_MS)) {
            const expiredTask = this.queue.shift();
            console.log(`[CompilerManager] Rejecting expired task in queue.`);
            expiredTask.reject(new Error("Request timed out in queue. Please try again."));
        }

        if (this.queue.length === 0) return;

        // See if there is an instance available below the soft capacity limit
        const bestUrl = this.getBestInstance();
        if (bestUrl && this.activeRequests[bestUrl] < this.MAX_CONCURRENT_PER_INSTANCE) {
            const nextTask = this.queue.shift();
            console.log(`[CompilerManager] Processing next task from queue. Remaining: ${this.queue.length}`);
            
            this.executeOnInstance(bestUrl, nextTask.code, nextTask.language, nextTask.timeout)
                .then(nextTask.resolve)
                .catch(nextTask.reject);
        }
    }
}

// Export a singleton instance
module.exports = new CompilerManager();
