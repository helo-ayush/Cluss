const express = require('express');
const { google } = require('googleapis');
const { YoutubeTranscript } = require('../utils/youtubeTranscript');
const { evaluateWithGemini } = require('../utils/geminiEvaluator');

const router = express.Router();

// Initialize the YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// --- HELPERS ---
const withTimeout = (promise, ms, fallback) =>
    Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(fallback), ms))
    ]);

// --- HELPER FUNCTION: Fetch Stats AND Transcripts ---
async function getVideoStats(videoIds) {
    if (videoIds.length === 0) return [];

    const response = await youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
    });

    const items = response.data.items.filter(item => {
        const match = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return true;
        const h = parseInt(match[1] || 0, 10);
        const m = parseInt(match[2] || 0, 10);
        const s = parseInt(match[3] || 0, 10);
        return (h * 3600 + m * 60 + s) > 60;
    });

    const videosWithTranscripts = await Promise.all(items.map(async (item) => {
        let transcriptText = "";
        try {
            const transcriptArray = await withTimeout(
                YoutubeTranscript.fetchTranscript(item.id),
                8000, // 8 second timeout
                []    // fallback to empty array
            );
            transcriptText = (transcriptArray || []).map(t => t.text).join(' ').substring(0, 15000);
        } catch (error) {
            console.log(`⚠️ Transcript fetch failed for ${item.id}: ${error.message}`);
            transcriptText = "";
        }

        return {
            id: item.id,
            title: item.snippet.title,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            viewCount: parseInt(item.statistics.viewCount || 0),
            likeCount: parseInt(item.statistics.likeCount || 0),
            likeViewRatio: (parseInt(item.statistics.likeCount || 0) / parseInt(item.statistics.viewCount || 1)),
            transcript: transcriptText
        };
    }));

    return videosWithTranscripts;
}

// --- HELPER: General Search ---
async function performGeneralSearch(searchQuery) {
    const searchRes = await youtube.search.list({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: 20
    });

    const videoIds = searchRes.data.items.map(item => item.id.videoId);
    const videosWithStats = await getVideoStats(videoIds);

    const totalViews = videosWithStats.reduce((sum, vid) => sum + vid.viewCount, 0);
    const avgViews = totalViews / (videosWithStats.length || 1);

    const aboveAverageVids = videosWithStats.filter(vid => vid.viewCount >= avgViews);
    const top5Views = aboveAverageVids.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
    const top5Ratio = [...videosWithStats].sort((a, b) => b.likeViewRatio - a.likeViewRatio).slice(0, 5);

    const combinedMap = new Map();
    top5Views.forEach(vid => combinedMap.set(vid.id, vid));
    top5Ratio.forEach(vid => combinedMap.set(vid.id, vid));

    return Array.from(combinedMap.values());
}

/**
 * Reusable core: Find the best video for a search query.
 * Called by both the route handler and modulePreparer.
 * @returns {Object|null} The winning video with id, title, channelTitle, channelId, transcript, aiScore
 */
async function findBestVideo(searchQuery, preferredCreators = []) {
    let winningVideo = null;
    let searchTypeUsed = '';

    // STEP 1: Biased Search
    if (preferredCreators && preferredCreators.length > 0) {
        console.log(`\n--- Biased Search for: "${searchQuery}" ---`);
        const limits = [5, 3, 2];

        for (let i = 0; i < preferredCreators.length; i++) {
            if (i >= limits.length) break;
            const channelId = preferredCreators[i];

            const searchRes = await youtube.search.list({
                part: 'snippet',
                q: searchQuery,
                channelId: channelId,
                type: 'video',
                maxResults: limits[i]
            });

            const videoIds = searchRes.data.items.map(item => item.id.videoId);
            if (videoIds.length === 0) continue;

            const candidateVideos = await getVideoStats(videoIds);
            const geminiChoice = await evaluateWithGemini(candidateVideos, searchQuery);

            if (geminiChoice) {
                winningVideo = geminiChoice;
                searchTypeUsed = 'biased';
                break;
            }
        }
    }

    // STEP 2: General Search Fallback
    if (!winningVideo) {
        console.log(`\n--- General Search for: "${searchQuery}" ---`);
        const generalCandidates = await performGeneralSearch(searchQuery);
        winningVideo = await evaluateWithGemini(generalCandidates, searchQuery);
        searchTypeUsed = 'general';
    }

    if (winningVideo) {
        winningVideo.searchType = searchTypeUsed;
    }

    return winningVideo;
}

// --- MAIN ROUTE (kept for direct API calls) ---
router.post('/', async (req, res) => {
    try {
        const { search_query, preferred_creators } = req.body;
        const winningVideo = await findBestVideo(search_query, preferred_creators);

        if (!winningVideo) {
            return res.status(404).json({
                success: false,
                message: "Could not find a high-quality video for this topic."
            });
        }

        res.json({
            success: true,
            searchType: winningVideo.searchType,
            video: winningVideo
        });
    } catch (error) {
        console.error("Error in Search Engine:", error);
        res.status(500).json({ success: false, message: "Engine Failure", error: error.message });
    }
});

module.exports = router;
module.exports.findBestVideo = findBestVideo;