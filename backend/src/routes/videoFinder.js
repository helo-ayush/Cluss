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

async function getVideoStats(videoIds) {
    if (videoIds.length === 0) return [];

    const response = await youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(',')
    });

    const items = response.data.items.filter(item => {
        const match = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return true;
        const h = parseInt(match[1] || 0, 10);
        const m = parseInt(match[2] || 0, 10);
        const s = parseInt(match[3] || 0, 10);
        return (h * 3600 + m * 60 + s) > 60;
    });

    return items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        viewCount: parseInt(item.statistics.viewCount || 0, 10),
        likeCount: parseInt(item.statistics.likeCount || 0, 10),
        likeViewRatio: parseInt(item.statistics.likeCount || 0, 10) / parseInt(item.statistics.viewCount || 1, 10),
        transcript: '' // Transcripts fetched later for top 3
    }));
}

// --- HELPER: Micro-Batch Pipeline for Transcripts ---
async function fetchTranscriptsForTop3(videos) {
    if (!videos || videos.length === 0) return [];

    const top3 = videos.slice(0, 3);
    console.log(`Fetching transcripts in parallel for top ${top3.length} videos...`);

    try {
        const transcriptResult = await withTimeout(
            YoutubeTranscript.fetchTranscriptsBatch(top3.map(vid => vid.id)),
            45000,
            { data: {} }
        );

        top3.forEach(vid => {
            const transcriptArray = transcriptResult?.data?.[vid.id];
            const text = Array.isArray(transcriptArray)
                ? transcriptArray.map(segment => segment.text).join(' ')
                : '';

            vid.transcript = text.length > 100 ? text.substring(0, 15000) : '';
        });
    } catch (err) {
        top3.forEach(vid => {
            vid.transcript = '';
            console.error(`  Transcript fetch failed for ${vid.id}:`, err.message);
        });
    }

    return top3;
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
                channelId,
                type: 'video',
                maxResults: limits[i]
            });

            const videoIds = searchRes.data.items.map(item => item.id.videoId);
            if (videoIds.length === 0) continue;

            let candidateVideos = await getVideoStats(videoIds);
            candidateVideos = await fetchTranscriptsForTop3(candidateVideos);
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
        let generalCandidates = await performGeneralSearch(searchQuery);
        generalCandidates = await fetchTranscriptsForTop3(generalCandidates);
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
                message: 'Could not find a high-quality video for this topic.'
            });
        }

        res.json({
            success: true,
            searchType: winningVideo.searchType,
            video: winningVideo
        });
    } catch (error) {
        console.error('Error in Search Engine:', error);
        res.status(500).json({ success: false, message: 'Engine Failure', error: error.message });
    }
});

module.exports = router;
module.exports.findBestVideo = findBestVideo;
