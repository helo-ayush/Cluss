const { google } = require('googleapis');
const User = require('../models/User');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const { generateCheckpoint, gradeCheckpoint } = require('../utils/checkpointGenerator');
const { serializeStudyPlan } = require('../services/studyPlanMetrics');
const { assertCredits, spendCredits, maybeRefillCredits } = require('../middleware/creditManager');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

const logActivity = async (userId, courseId, courseTitle, count = 1) => {
    try {
        const dateStr = new Date().toISOString().slice(0, 10);
        await Activity.findOneAndUpdate(
            { userId, date: dateStr },
            {
                $inc: { subtopicsCompleted: count },
                $setOnInsert: { userId, date: dateStr }
            },
            { upsert: true, returnDocument: 'after' }
        );

        const existing = await Activity.findOne({ userId, date: dateStr });
        if (!existing) return;

        const courseEntry = existing.courses.find(
            (entry) => entry.courseId?.toString() === courseId?.toString()
        );

        if (courseEntry) {
            courseEntry.count += count;
        } else {
            existing.courses.push({ courseId, courseTitle, count });
        }

        await existing.save();
    } catch (err) {
        console.error('logActivity error (playlist, non-fatal):', err.message);
    }
};

const extractPlaylistId = (url) => {
    if (!url) return '';

    const trimmed = url.trim();
    if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.startsWith('http')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        return parsed.searchParams.get('list') || '';
    } catch (err) {
        return '';
    }
};

const createFromPlaylist = async (req, res) => {
    try {
        const { clerkId, playlistUrl, hoursPerDay = 2, userName } = req.body;

        if (!clerkId || !playlistUrl) {
            return res.status(400).json({ success: false, message: 'clerkId and playlistUrl are required' });
        }

        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            return res.status(400).json({ success: false, message: 'Invalid YouTube playlist URL. Please provide a valid playlist link.' });
        }

        let user = req.dbUser || await User.findOne({ clerkId });
        if (!user) {
            user = await User.create({ clerkId, name: userName || 'Learner' });
        }

        await maybeRefillCredits(user);
        assertCredits(user, 'playlistImport');

        let playlistTitle = 'Imported Playlist';
        try {
            const plRes = await youtube.playlists.list({
                part: 'snippet',
                id: playlistId
            });

            if (plRes.data.items && plRes.data.items.length > 0) {
                playlistTitle = plRes.data.items[0].snippet.title;
            } else {
                return res.status(404).json({ success: false, message: 'Playlist not found. It may be private or deleted.' });
            }
        } catch (err) {
            console.error('Error fetching playlist metadata:', err.message);
            return res.status(400).json({ success: false, message: 'Could not fetch playlist details. The playlist may be private.' });
        }

        const allItems = [];
        let nextPageToken = null;
        do {
            const pageRes = await youtube.playlistItems.list({
                part: 'snippet,contentDetails',
                playlistId,
                maxResults: 50,
                pageToken: nextPageToken || undefined
            });

            allItems.push(...(pageRes.data.items || []));
            nextPageToken = pageRes.data.nextPageToken || null;
        } while (nextPageToken && allItems.length < 500);

        if (!allItems.length) {
            return res.status(400).json({ success: false, message: 'This playlist is empty.' });
        }

        const rawVideos = allItems
            .map((item) => ({
                videoId: item.contentDetails?.videoId,
                title: item.snippet?.title,
                channel: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || '',
                channelId: item.snippet?.videoOwnerChannelId || item.snippet?.channelId || ''
            }))
            .filter((video) => video.videoId && video.title && video.title !== 'Deleted video' && video.title !== 'Private video');

        if (!rawVideos.length) {
            return res.status(400).json({ success: false, message: 'No accessible videos found in this playlist.' });
        }

        const ids = rawVideos.map((video) => video.videoId);
        const detailsRes = await youtube.videos.list({
            part: 'contentDetails',
            id: ids.join(',')
        });

        const durationById = {};
        (detailsRes.data.items || []).forEach((item) => {
            const durationIso = item.contentDetails?.duration || 'PT0M';
            const match = durationIso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = Number(match?.[1] || 0);
            const minutes = Number(match?.[2] || 0);
            const seconds = Number(match?.[3] || 0);
            durationById[item.id] = (hours * 3600) + (minutes * 60) + seconds;
        });

        const videosWithDuration = rawVideos.map((video) => ({
            ...video,
            duration: durationById[video.videoId] || 0,
            transcript: ''
        }));

        const maxSecondsPerDay = Math.max(Number(hoursPerDay) || 2, 0.5) * 3600;
        const days = [];
        let currentDay = { dayNumber: 1, videos: [], totalDuration: 0, status: 'unprocessed', checkpoint: { status: 'available' } };

        videosWithDuration.forEach((video) => {
            if (currentDay.totalDuration + video.duration > maxSecondsPerDay && currentDay.videos.length > 0) {
                days.push(currentDay);
                currentDay = { dayNumber: days.length + 1, videos: [], totalDuration: 0, status: 'unprocessed', checkpoint: { status: 'locked' } };
            }

            currentDay.videos.push(video);
            currentDay.totalDuration += video.duration;
        });

        if (currentDay.videos.length > 0) days.push(currentDay);

        const newCourse = await Course.create({
            userId: user._id,
            course_query: playlistTitle,
            course_title: playlistTitle,
            sourceType: 'playlist',
            sourcePlaylistId: playlistId,
            learningGoal: playlistTitle,
            hoursPerDay: Math.max(Number(hoursPerDay) || 2, 0.5),
            currentDayIndex: 0,
            days
        });

        await spendCredits(user, 'playlistImport');

        return res.json({ success: true, course: serializeStudyPlan(newCourse) });
    } catch (error) {
        console.error('Error in createFromPlaylist:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Internal server error'
        });
    }
};

const getUserPlaylistCourses = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.json({ success: true, courses: [] });
        }

        const courses = await Course.find({ userId: user._id, sourceType: 'playlist' }).sort({ updatedAt: -1 });
        return res.json({ success: true, courses: courses.map(serializeStudyPlan) });
    } catch (error) {
        console.error('Error in getUserPlaylistCourses:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const getPlaylistStudyPlanById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);

        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        return res.json({ success: true, course: serializeStudyPlan(course) });
    } catch (error) {
        console.error('Error in getPlaylistStudyPlanById:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const deleteStudyPlanHandler = async (req, res) => {
    try {
        const { courseId } = req.params;
        const deleted = await Course.findByIdAndDelete(courseId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Error in deleteStudyPlanHandler:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const getCheckpoint = async (req, res) => {
    try {
        const { courseId, dayIndex } = req.params;
        const idx = parseInt(dayIndex, 10);

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        const day = course.days[idx];
        if (!day) {
            return res.status(404).json({ success: false, message: 'Day not found' });
        }

        if (day.checkpoint && day.checkpoint.theoryQuestions && day.checkpoint.theoryQuestions.length > 0) {
            return res.json({ success: true, checkpoint: day.checkpoint });
        }

        const user = await User.findById(course.userId);
        await maybeRefillCredits(user);
        assertCredits(user, 'playlistCheckpointGeneration');

        const videoTitles = day.videos.map((video) => video.title);
        const result = await generateCheckpoint(videoTitles, course.course_title, user?.plan);

        day.checkpoint = {
            status: 'available',
            attemptsUsed: 0,
            maxAttempts: 3,
            lastScore: 0,
            questionType: result.questionType || 'theory',
            theoryQuestions: result.theoryQuestions || [],
            codingQuestion: result.codingQuestion || { prompt: '', language: '', expectedBehavior: '' },
            submissions: []
        };

        await course.save();
        await spendCredits(user, 'playlistCheckpointGeneration');
        return res.json({ success: true, checkpoint: day.checkpoint });
    } catch (error) {
        console.error('Error in getCheckpoint:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message
        });
    }
};

const submitCheckpoint = async (req, res) => {
    try {
        const { courseId, dayIndex } = req.params;
        const { clerkId, theoryAnswers, codeFiles } = req.body;
        const idx = parseInt(dayIndex, 10);

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        const day = course.days[idx];
        if (!day || !day.checkpoint) {
            return res.status(404).json({ success: false, message: 'Day or checkpoint not found' });
        }

        const user = await User.findOne({ clerkId });
        const maxAttempts = (user && (user.plan === 'pro' || user.plan === 'ultra')) ? 8 : 3;
        day.checkpoint.maxAttempts = maxAttempts;

        if (day.checkpoint.attemptsUsed >= maxAttempts) {
            if (day.checkpoint.status !== 'passed') {
                day.checkpoint.status = 'failed_all';
                await course.save();
            }

            return res.status(400).json({
                success: false,
                message: 'All attempts exhausted. Day has been unlocked anyway.',
                checkpoint: day.checkpoint
            });
        }

        const owner = user || await User.findById(course.userId);
        await maybeRefillCredits(owner);
        assertCredits(owner, 'playlistCheckpointGrading');

        const gradeResult = await gradeCheckpoint({
            courseTitle: course.course_title,
            videoTitles: day.videos.map((video) => video.title),
            questionType: day.checkpoint.questionType,
            theoryQuestions: day.checkpoint.theoryQuestions,
            theoryAnswers: theoryAnswers || [],
            codingQuestion: day.checkpoint.codingQuestion,
            codeFiles: codeFiles || []
        });

        day.checkpoint.attemptsUsed += 1;
        day.checkpoint.lastScore = gradeResult.overallScore;
        day.checkpoint.submissions.push({
            attemptNumber: day.checkpoint.attemptsUsed,
            theoryAnswers: theoryAnswers || [],
            codeFiles: codeFiles || [],
            score: gradeResult.overallScore,
            feedback: gradeResult,
            submittedAt: new Date()
        });

        const passed = gradeResult.passed && gradeResult.overallScore >= 60;

        if (passed) {
            day.checkpoint.status = 'passed';
            day.status = 'ready';
            if (idx + 1 < course.days.length) {
                course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                if (course.days[idx + 1].checkpoint) {
                    course.days[idx + 1].checkpoint.status = 'available';
                }
            }
            await logActivity(course.userId, courseId, course.course_title, day.videos.length);
        } else if (day.checkpoint.attemptsUsed >= maxAttempts) {
            day.checkpoint.status = 'failed_all';
            if (idx + 1 < course.days.length) {
                course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                if (course.days[idx + 1].checkpoint) {
                    course.days[idx + 1].checkpoint.status = 'available';
                }
            }
        }

        await course.save();
        await spendCredits(owner, 'playlistCheckpointGrading');

        return res.json({
            success: true,
            passed,
            score: gradeResult.overallScore,
            attemptsRemaining: maxAttempts - day.checkpoint.attemptsUsed,
            feedback: gradeResult,
            checkpoint: day.checkpoint
        });
    } catch (error) {
        console.error('Error in submitCheckpoint:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message
        });
    }
};

const markDayReady = async (req, res) => {
    try {
        const { courseId, dayIndex } = req.params;
        const idx = parseInt(dayIndex, 10);

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        const day = course.days[idx];
        if (!day) {
            return res.status(404).json({ success: false, message: 'Day not found' });
        }

        if (day.status !== 'ready') {
            day.status = 'ready';
            if (idx + 1 < course.days.length) {
                course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                if (course.days[idx + 1].checkpoint) {
                    course.days[idx + 1].checkpoint.status = 'available';
                }
            }
            await logActivity(course.userId, courseId, course.course_title, day.videos.length);
            await course.save();
        }

        return res.json({ success: true, course: serializeStudyPlan(course) });
    } catch (error) {
        console.error('Error in markDayReady:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    createFromPlaylist,
    getUserPlaylistCourses,
    getPlaylistStudyPlanById,
    deleteStudyPlanHandler,
    getCheckpoint,
    submitCheckpoint,
    markDayReady
};

