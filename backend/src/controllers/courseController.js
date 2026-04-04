const User = require('../models/User');
const Course = require('../models/Course');
const Activity = require('../models/Activity');
const { prepareModule } = require('../utils/modulePreparer');
const { PLAN_LIMITS, recordTopicUnlock } = require('../middleware/usageLimiter');

/**
 * Logs a subtopic completion event for today's activity record.
 */
const logActivity = async (userId, courseId, courseTitle, count = 1) => {
    try {
        const dateStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        await Activity.findOneAndUpdate(
            { userId, date: dateStr },
            {
                $inc: { subtopicsCompleted: count },
                $setOnInsert: { userId, date: dateStr },
                // Update course entry if exists, else push new
            },
            { upsert: true, new: true }
        );
        // Separately update the courses sub-array
        const existing = await Activity.findOne({ userId, date: dateStr });
        if (existing) {
            const courseEntry = existing.courses.find(
                c => c.courseId?.toString() === courseId?.toString()
            );
            if (courseEntry) {
                courseEntry.count += count;
            } else {
                existing.courses.push({ courseId, courseTitle, count });
            }
            await existing.save();
        }
    } catch (err) {
        // Non-blocking — don't fail the main request
        console.error('logActivity error (non-fatal):', err.message);
    }
};

/**
 * Initializes a new course from LLM generated JSON and assigns it to the user.
 */
const initializeCourse = async (userId, llmGeneratedJson) => {
    try {
        // Unlock all subtopics of the first module to 'active'
        if (llmGeneratedJson.modules && llmGeneratedJson.modules.length > 0) {
            llmGeneratedJson.modules[0].subtopics.forEach(sub => {
                sub.status = 'active';
            });
        }

        const newCourse = new Course({
            userId,
            course_query: llmGeneratedJson.course_query,
            course_title: llmGeneratedJson.course_title,
            modules: llmGeneratedJson.modules
        });

        const savedCourse = await newCourse.save();

        await User.findByIdAndUpdate(userId, {
            activeCourseId: savedCourse._id
        });

        return savedCourse;
    } catch (error) {
        console.error("Error in initializeCourse:", error);
        throw error;
    }
};

/**
 * Updates the user's trusted creators array based on search type.
 */
const updateTrustedCreators = async (userId, winningChannelId, searchType) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let creators = user.trusted_creators || [];

        if (searchType === 'biased') {
            const index = creators.indexOf(winningChannelId);
            if (index > 0) {
                creators.splice(index, 1);
                creators.unshift(winningChannelId);
            }
        } else if (searchType === 'general') {
            creators.unshift(winningChannelId);
            creators = [...new Set(creators)];
            if (creators.length > 3) {
                creators.pop();
            }
        }

        user.trusted_creators = creators;
        await user.save();
        return user;
    } catch (error) {
        console.error("Error in updateTrustedCreators:", error);
        throw error;
    }
};

/**
 * Marks current subtopic complete and unlocks the next one in sequence.
 */
const markSubtopicCompleteAndUnlockNext = async (courseId) => {
    try {
        const course = await Course.findById(courseId);
        if (!course) throw new Error("Course not found");

        const { current_module_index, current_subtopic_index, modules } = course;

        if (current_module_index >= modules.length) {
            throw new Error("Course already complete or invalid module index");
        }

        const currentModule = modules[current_module_index];

        if (current_subtopic_index >= currentModule.subtopics.length) {
            throw new Error("Invalid subtopic index");
        }

        currentModule.subtopics[current_subtopic_index].status = 'completed';

        let nextModuleIndex = current_module_index;
        let nextSubtopicIndex = current_subtopic_index + 1;

        if (nextSubtopicIndex >= currentModule.subtopics.length) {
            nextModuleIndex++;
            nextSubtopicIndex = 0;
        }

        if (nextModuleIndex < modules.length) {
            if (modules[nextModuleIndex].subtopics && modules[nextModuleIndex].subtopics.length > nextSubtopicIndex) {
                modules[nextModuleIndex].subtopics[nextSubtopicIndex].status = 'active';
            }
            course.current_module_index = nextModuleIndex;
            course.current_subtopic_index = nextSubtopicIndex;
        }

        const updatedCourse = await course.save();
        return updatedCourse;
    } catch (error) {
        console.error("Error in markSubtopicCompleteAndUnlockNext:", error);
        throw error;
    }
};

/**
 * Assessment Engine: Generates and saves a quiz for a subtopic
 */
const generateAndSaveQuiz = async (req, res) => {
    try {
        const { courseId, moduleIndex, subtopicIndex } = req.params;
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ success: false, message: "Transcript is required" });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const currentModule = course.modules[moduleIndex];
        if (!currentModule || !currentModule.subtopics[subtopicIndex]) {
            return res.status(404).json({ success: false, message: "Module or subtopic index invalid" });
        }

        const subtopic = currentModule.subtopics[subtopicIndex];

        if (subtopic.quiz && subtopic.quiz.length > 0) {
            return res.json({ success: true, cached: true, quiz: subtopic.quiz });
        }

        const { generateQuizFromTranscript } = require('../utils/quizGenerator');
        const generatedQuiz = await generateQuizFromTranscript(subtopic.subtopic_title, transcript);

        if (!generatedQuiz || !Array.isArray(generatedQuiz) || generatedQuiz.length === 0) {
            return res.status(500).json({ success: false, message: "Failed to generate quiz from transcript" });
        }

        subtopic.quiz = generatedQuiz;
        await course.save();

        return res.json({ success: true, cached: false, quiz: generatedQuiz });
    } catch (error) {
        console.error("Error in generateAndSaveQuiz:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Creates a new course and auto-triggers module preparation.
 * POST /api/course/create
 */
const createCourseHandler = async (req, res) => {
    try {
        const { clerkId, userName, llmCurriculum } = req.body;

        if (!clerkId || !llmCurriculum) {
            return res.status(400).json({ success: false, message: "clerkId and llmCurriculum are required" });
        }

        let user = req.dbUser || await User.findOne({ clerkId });
        if (!user) {
            user = await User.create({ clerkId, name: userName || 'Learner' });
        }

        const savedCourse = await initializeCourse(user._id, llmCurriculum);

        // ── Track usage for SaaS limits ──
        user.coursesCreated = (user.coursesCreated || 0) + 1;
        user.lastCourseCreatedAt = new Date();
        await user.save();

        // 🔥 Fire-and-forget: Automatically prepare the first module in the background
        const trustedCreators = user.trusted_creators || [];
        prepareModule(savedCourse._id.toString(), 0, trustedCreators)
            .then(() => console.log(`✅ Background prep finished for course ${savedCourse._id}, module 0`))
            .catch(err => console.error(`❌ Background prep failed:`, err));

        return res.json({ success: true, course: savedCourse });
    } catch (error) {
        console.error("Error in createCourseHandler:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Fetches all courses for a user with computed progress.
 * GET /api/course/user/:clerkId
 */
const getUserCourses = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.json({ success: true, courses: [], stats: { totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 } });
        }

        const courses = await Course.find({ userId: user._id }).sort({ updatedAt: -1 });

        let totalCompletedSubtopics = 0;
        let totalSubtopicsAll = 0;

        const coursesWithProgress = courses.map(course => {
            const courseObj = course.toObject();
            let completedCount = 0;
            let totalCount = 0;

            courseObj.modules.forEach(mod => {
                mod.subtopics.forEach(sub => {
                    totalCount++;
                    if (sub.status === 'completed') completedCount++;
                });
            });

            totalCompletedSubtopics += completedCount;
            totalSubtopicsAll += totalCount;

            courseObj.progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            courseObj.completedSubtopics = completedCount;
            courseObj.totalSubtopics = totalCount;
            courseObj.totalModules = courseObj.modules.length;

            return courseObj;
        });

        return res.json({
            success: true,
            courses: coursesWithProgress,
            stats: {
                totalCourses: courses.length,
                completedSubtopics: totalCompletedSubtopics,
                totalSubtopics: totalSubtopicsAll
            }
        });
    } catch (error) {
        console.error("Error in getUserCourses:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Fetches a single course by its ID.
 * GET /api/course/:courseId
 */
const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const courseObj = course.toObject();
        let completedCount = 0;
        let totalCount = 0;
        courseObj.modules.forEach(mod => {
            mod.subtopics.forEach(sub => {
                totalCount++;
                if (sub.status === 'completed') completedCount++;
            });
        });
        courseObj.progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return res.json({ success: true, course: courseObj });
    } catch (error) {
        console.error("Error in getCourseById:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Marks a single subtopic as watched/completed.
 * POST /api/course/:courseId/module/:moduleIndex/subtopic/:subtopicIndex/watched
 */
const markSubtopicWatched = async (req, res) => {
    try {
        const { courseId, moduleIndex, subtopicIndex } = req.params;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const mod = course.modules[moduleIndex];
        if (!mod || !mod.subtopics[subtopicIndex]) {
            return res.status(404).json({ success: false, message: "Invalid module or subtopic index" });
        }

        const wasAlreadyCompleted = mod.subtopics[subtopicIndex].status === 'completed';
        mod.subtopics[subtopicIndex].status = 'completed';
        await course.save();

        // Log activity only if newly completed (not already completed)
        if (!wasAlreadyCompleted) {
            logActivity(course.userId, courseId, course.course_title, 1);
            // Track daily topic unlock for free tier limits
            recordTopicUnlock(course.userId, courseId);
        }

        return res.json({ success: true, message: "Subtopic marked as completed" });
    } catch (error) {
        console.error("Error in markSubtopicWatched:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Module-level quiz grading. Collects all quiz questions from every subtopic in the module,
 * grades them, and if ≥80%, marks the entire module complete and triggers prep for next module.
 * POST /api/course/:courseId/module/:moduleIndex/grade-module
 */
const gradeModuleQuiz = async (req, res) => {
    try {
        const { courseId, moduleIndex: modIdxStr } = req.params;
        const moduleIndex = parseInt(modIdxStr, 10);
        const { userAnswers } = req.body;

        if (!userAnswers || !Array.isArray(userAnswers)) {
            return res.status(400).json({ success: false, message: "userAnswers array is required" });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const targetModule = course.modules[moduleIndex];
        if (!targetModule) return res.status(404).json({ success: false, message: "Module not found" });

        // Collect all quiz questions from all subtopics in this module
        const allQuestions = [];
        targetModule.subtopics.forEach(sub => {
            if (sub.quiz && sub.quiz.length > 0) {
                sub.quiz.forEach(q => allQuestions.push(q));
            }
        });

        if (allQuestions.length === 0) {
            return res.status(400).json({ success: false, message: "No quiz questions found for this module" });
        }

        // We no longer strictly reject size mismatches, but we enforce grading for all questions.
        // Unanswered questions (undefined or null) are automatically incorrect.

        // Grade
        let correctCount = 0;
        const results = allQuestions.map((q, i) => {
            const userAnswer = userAnswers[i] || null;
            const correct = q.correctAnswer === userAnswer;
            if (correct) correctCount++;
            return {
                question: q.question,
                selectedAnswer: userAnswer,
                correctAnswer: q.correctAnswer,
                correct,
                explanation: q.explanation
            };
        });

        const scorePercentage = Math.round((correctCount / allQuestions.length) * 100);

        // ── Dynamic pass threshold based on plan ──
        const quizUser = await User.findById(course.userId);
        const userPlan = quizUser?.plan || 'free';
        const passThreshold = PLAN_LIMITS[userPlan].quizPassThreshold;

        const passed = scorePercentage >= passThreshold;

        // ── Cache the latest report card to the module ──
        targetModule.quizReport = {
            passed,
            score: scorePercentage,
            correctCount,
            totalQuestions: allQuestions.length,
            results,
            passThreshold,
            message: passed ? `🎉 You scored ${scorePercentage}%! Module completed and next module is being prepared.` : `You scored ${scorePercentage}%. Need ${passThreshold}% to pass. Review the material and try again!`
        };

        if (passed) {
            // Count newly completed subtopics for activity logging
            const newlyCompleted = targetModule.subtopics.filter(s => s.status !== 'completed').length;

            // Mark ALL subtopics in this module as completed
            targetModule.subtopics.forEach(sub => { sub.status = 'completed'; });

            // Unlock next module
            const nextModuleIndex = moduleIndex + 1;
            if (nextModuleIndex < course.modules.length) {
                // Unlock all subtopics of the next module
                course.modules[nextModuleIndex].subtopics.forEach(sub => { sub.status = 'active'; });
                course.current_module_index = nextModuleIndex;
                course.current_subtopic_index = 0;
            }

            await course.save();

            // Log activity for module completion
            if (newlyCompleted > 0) {
                logActivity(course.userId, courseId, course.course_title, newlyCompleted);
            }

            // 🔥 Fire-and-forget: Prepare the next module in the background
            if (nextModuleIndex < course.modules.length) {
                const user = await User.findById(course.userId);
                const trustedCreators = user?.trusted_creators || [];
                prepareModule(courseId, nextModuleIndex, trustedCreators)
                    .then(() => console.log(`✅ Background prep done for module ${nextModuleIndex}`))
                    .catch(err => console.error(`❌ Background prep failed:`, err));
            }

            return res.json({ success: true, ...targetModule.quizReport });
        } else {
            await course.save(); // save the failed report card too
            return res.json({ success: true, ...targetModule.quizReport });
        }
    } catch (error) {
        console.error("Error in gradeModuleQuiz:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Get module preparation status.
 * GET /api/course/:courseId/module/:moduleIndex/prep-status
 */
const getModulePrepStatus = async (req, res) => {
    try {
        const { courseId, moduleIndex } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const mod = course.modules[moduleIndex];
        if (!mod) return res.status(404).json({ success: false, message: "Module not found" });

        const videosReady = mod.subtopics.filter(s => s.videoId).length;
        const quizzesReady = mod.subtopics.filter(s => s.quiz && s.quiz.length > 0).length;

        return res.json({
            success: true,
            prepStatus: mod.prepStatus,
            videosReady,
            quizzesReady,
            totalSubtopics: mod.subtopics.length
        });
    } catch (error) {
        console.error("Error in getModulePrepStatus:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Manually trigger module preparation (for courses created before the auto-pipeline).
 * POST /api/course/:courseId/module/:moduleIndex/prepare
 */
const triggerPrepare = async (req, res) => {
    try {
        const { courseId, moduleIndex: modIdxStr } = req.params;
        const moduleIndex = parseInt(modIdxStr, 10);

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const mod = course.modules[moduleIndex];
        if (!mod) return res.status(404).json({ success: false, message: "Module not found" });

        if (mod.prepStatus === 'preparing') {
            return res.json({ success: true, message: "Already preparing" });
        }

        // Unlock all subtopics in this module to active
        mod.subtopics.forEach(s => { if (s.status === 'locked') s.status = 'active'; });
        mod.prepStatus = 'preparing';
        await course.save();

        const user = await User.findById(course.userId);
        const trustedCreators = user?.trusted_creators || [];

        // Fire-and-forget
        prepareModule(courseId, moduleIndex, trustedCreators)
            .then(() => console.log(`✅ Manual prep done for module ${moduleIndex}`))
            .catch(err => console.error(`❌ Manual prep failed:`, err));

        return res.json({ success: true, message: "Preparation started" });
    } catch (error) {
        console.error("Error in triggerPrepare:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Deletes a course from the database by ID.
 * DELETE /api/course/:courseId
 */
const deleteCourseHandler = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        return res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
        console.error("Error in deleteCourseHandler:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ══════════════════════════════════════════════════
//  Playlist Import: Helpers
// ══════════════════════════════════════════════════

/**
 * Parses a YouTube playlist ID from various URL formats.
 */
const extractPlaylistId = (url) => {
    try {
        // Handle full URLs
        const urlObj = new URL(url);
        const listParam = urlObj.searchParams.get('list');
        if (listParam) return listParam;
    } catch (e) {
        // Not a valid URL — try raw ID
    }
    // If it looks like a raw playlist ID
    if (/^PL[a-zA-Z0-9_-]+$/.test(url) || /^UU[a-zA-Z0-9_-]+$/.test(url) || /^OL[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }
    return null;
};

/**
 * Parses ISO 8601 duration (PT#H#M#S) to total seconds.
 */
const parseDuration = (iso) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || 0, 10);
    const m = parseInt(match[2] || 0, 10);
    const s = parseInt(match[3] || 0, 10);
    return h * 3600 + m * 60 + s;
};

/**
 * Chunks a flat array of videos into days based on a max seconds-per-day budget.
 */
const chunkIntoDays = (videos, maxSecondsPerDay) => {
    const days = [];
    let currentDay = { dayNumber: 1, videos: [], totalDuration: 0 };

    for (const video of videos) {
        // If adding this video would exceed the budget AND the day already has at least one video,
        // start a new day. (A single video that exceeds the budget goes into its own day.)
        if (currentDay.totalDuration + video.duration > maxSecondsPerDay && currentDay.videos.length > 0) {
            days.push(currentDay);
            currentDay = { dayNumber: days.length + 1, videos: [], totalDuration: 0 };
        }
        currentDay.videos.push(video);
        currentDay.totalDuration += video.duration;
    }

    // Push the last day if it has videos
    if (currentDay.videos.length > 0) {
        days.push(currentDay);
    }

    return days;
};

// ══════════════════════════════════════════════════
//  Playlist Import: Main Handler
// ══════════════════════════════════════════════════

/**
 * Express Handler: Create a course from a YouTube playlist URL.
 * POST /api/course/from-playlist
 * Body: { clerkId, playlistUrl, hoursPerDay, userName }
 */
const createFromPlaylist = async (req, res) => {
    try {
        const { clerkId, playlistUrl, hoursPerDay = 2, userName } = req.body;

        if (!clerkId || !playlistUrl) {
            return res.status(400).json({ success: false, message: "clerkId and playlistUrl are required" });
        }

        // 1. Parse playlist ID
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            return res.status(400).json({ success: false, message: "Invalid YouTube playlist URL. Please provide a valid playlist link." });
        }

        // 2. Initialize YouTube API
        const { google } = require('googleapis');
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        // 3. Fetch playlist metadata (title)
        let playlistTitle = 'Imported Playlist';
        try {
            const plRes = await youtube.playlists.list({
                part: 'snippet',
                id: playlistId
            });
            if (plRes.data.items && plRes.data.items.length > 0) {
                playlistTitle = plRes.data.items[0].snippet.title;
            } else {
                return res.status(404).json({ success: false, message: "Playlist not found. It may be private or deleted." });
            }
        } catch (err) {
            console.error("Error fetching playlist metadata:", err.message);
            return res.status(400).json({ success: false, message: "Could not fetch playlist details. The playlist may be private." });
        }

        // 4. Fetch all playlist items (paginated, max 500 videos)
        let allItems = [];
        let nextPageToken = null;
        const MAX_VIDEOS = 500;

        do {
            const pageRes = await youtube.playlistItems.list({
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken || undefined
            });

            const items = pageRes.data.items || [];
            allItems = allItems.concat(items);
            nextPageToken = pageRes.data.nextPageToken;

            if (allItems.length >= MAX_VIDEOS) {
                allItems = allItems.slice(0, MAX_VIDEOS);
                break;
            }
        } while (nextPageToken);

        if (allItems.length === 0) {
            return res.status(400).json({ success: false, message: "This playlist is empty." });
        }

        // 5. Extract video IDs (skip deleted/private videos)
        const videoEntries = allItems
            .filter(item => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
            .map(item => ({
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                channel: item.snippet.videoOwnerChannelTitle || '',
                channelId: item.snippet.videoOwnerChannelId || ''
            }));

        if (videoEntries.length === 0) {
            return res.status(400).json({ success: false, message: "No accessible videos found in this playlist." });
        }

        // 6. Batch-fetch video durations (50 IDs per call)
        const durationMap = {};
        for (let i = 0; i < videoEntries.length; i += 50) {
            const batch = videoEntries.slice(i, i + 50);
            const ids = batch.map(v => v.videoId).join(',');

            try {
                const vidRes = await youtube.videos.list({
                    part: 'contentDetails',
                    id: ids
                });

                for (const item of (vidRes.data.items || [])) {
                    durationMap[item.id] = parseDuration(item.contentDetails.duration);
                }
            } catch (err) {
                console.error(`Error fetching video durations batch ${i}:`, err.message);
            }
        }

        // Merge durations into video entries
        const videosWithDuration = videoEntries.map(v => ({
            videoId: v.videoId,
            title: v.title,
            duration: durationMap[v.videoId] || 0,
            channel: v.channel,
            channelId: v.channelId
        }));

        // 7. Chunk into days
        const maxSecondsPerDay = Math.max(hoursPerDay, 0.5) * 3600; // min 30 minutes per day
        const days = chunkIntoDays(videosWithDuration, maxSecondsPerDay);

        // 8. Find or create user
        let user = req.dbUser || await User.findOne({ clerkId });
        if (!user) {
            user = await User.create({ clerkId, name: userName || 'Learner' });
        }

        // 9. Save course
        const newCourse = new Course({
            userId: user._id,
            course_title: playlistTitle,
            course_query: '',
            sourceType: 'playlist',
            sourcePlaylistId: playlistId,
            hoursPerDay: hoursPerDay,
            days: days,
            currentDayIndex: 0
        });

        const savedCourse = await newCourse.save();

        // Track usage
        user.coursesCreated = (user.coursesCreated || 0) + 1;
        user.lastCourseCreatedAt = new Date();
        await user.save();

        console.log(`✅ Playlist course created: "${playlistTitle}" — ${videosWithDuration.length} videos, ${days.length} days`);

        return res.json({
            success: true,
            course: savedCourse
        });

    } catch (error) {
        console.error("Error in createFromPlaylist:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * Express Handler: Fetches only playlist-sourced courses for a user.
 * GET /api/course/user/:clerkId/playlists
 */
const getUserPlaylistCourses = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.json({ success: true, courses: [] });
        }

        const courses = await Course.find({ userId: user._id, sourceType: 'playlist' }).sort({ updatedAt: -1 });

        const coursesWithProgress = courses.map(course => {
            const courseObj = course.toObject();
            let completedDays = 0;
            let totalVideos = 0;

            courseObj.days.forEach(day => {
                totalVideos += day.videos.length;
                if (day.status === 'ready') completedDays++;
            });

            courseObj.progress = courseObj.days.length > 0 ? Math.round((completedDays / courseObj.days.length) * 100) : 0;
            courseObj.completedDays = completedDays;
            courseObj.totalDays = courseObj.days.length;
            courseObj.totalVideos = totalVideos;

            return courseObj;
        });

        return res.json({ success: true, courses: coursesWithProgress });
    } catch (error) {
        console.error("Error in getUserPlaylistCourses:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ══════════════════════════════════════════════════
//  AI Curriculum Optimizer
// ══════════════════════════════════════════════════

/**
 * POST /:courseId/playlist/analyze
 * Analyzes the playlist and returns topic blocks with outdated flags. (FREE)
 */
const analyzePlaylistCurriculum = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Playlist course not found" });
        }

        // Gather all video titles
        const videoTitles = [];
        course.days.forEach(day => {
            day.videos.forEach(v => videoTitles.push(v.title));
        });

        if (videoTitles.length === 0) {
            return res.status(400).json({ success: false, message: "No videos to analyze" });
        }

        // Check cache — if we already analyzed, use it
        let analysis = course.topicAnalysis;
        if (!analysis || !analysis.topicBlocks) {
            const { analyzePlaylistTopics } = require('../utils/playlistAnalyzer');
            analysis = await analyzePlaylistTopics(videoTitles, course.course_title);

            // Cache full result (both outdated + relevant) for internal use
            course.topicAnalysis = analysis;
            await course.save();
        }

        // Return ONLY outdated topics to the frontend
        const outdatedOnly = {
            topicBlocks: (analysis.topicBlocks || []).filter(b => b.isOutdated === true)
        };

        return res.json({ success: true, analysis: outdatedOnly });
    } catch (error) {
        console.error("Error in analyzePlaylistCurriculum:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /:courseId/playlist/remove-topics
 * Body: { topicNames: ["jQuery", "Bower"] }
 * Removes videos belonging to selected topics, re-chunks days.
 */
const removeOutdatedTopics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { topicNames } = req.body;

        if (!topicNames || !Array.isArray(topicNames) || topicNames.length === 0) {
            return res.status(400).json({ success: false, message: "topicNames array is required" });
        }

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Playlist course not found" });
        }

        const analysis = course.topicAnalysis;
        if (!analysis || !analysis.topicBlocks) {
            return res.status(400).json({ success: false, message: "Run analysis first" });
        }

        // Build set of video indices to remove
        const indicesToRemove = new Set();
        analysis.topicBlocks.forEach(block => {
            if (topicNames.includes(block.topicName)) {
                block.videoIndices.forEach(i => indicesToRemove.add(i));
            }
        });

        // Flatten all videos + filter out removed ones
        const allVideos = [];
        course.days.forEach(day => {
            day.videos.forEach(v => allVideos.push(v.toObject()));
        });

        const filteredVideos = allVideos.filter((_, i) => !indicesToRemove.has(i));

        if (filteredVideos.length === 0) {
            return res.status(400).json({ success: false, message: "Cannot remove all videos" });
        }

        // Re-chunk into days
        const maxSecondsPerDay = Math.max(course.hoursPerDay, 0.5) * 3600;
        const newDays = [];
        let currentDay = { dayNumber: 1, videos: [], totalDuration: 0 };

        for (const video of filteredVideos) {
            if (currentDay.totalDuration + video.duration > maxSecondsPerDay && currentDay.videos.length > 0) {
                newDays.push(currentDay);
                currentDay = { dayNumber: newDays.length + 1, videos: [], totalDuration: 0 };
            }
            currentDay.videos.push(video);
            currentDay.totalDuration += video.duration;
        }
        if (currentDay.videos.length > 0) newDays.push(currentDay);

        // Update course
        course.days = newDays;
        course.currentDayIndex = 0;
        // Clear cached analysis since structure changed
        course.topicAnalysis = null;
        await course.save();

        console.log(`🧹 Removed ${indicesToRemove.size} videos from ${topicNames.length} topics. Now ${filteredVideos.length} videos in ${newDays.length} days.`);

        return res.json({
            success: true,
            removedCount: indicesToRemove.size,
            newDayCount: newDays.length,
            newVideoCount: filteredVideos.length
        });
    } catch (error) {
        console.error("Error in removeOutdatedTopics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /:courseId/playlist/suggest-fillers
 * PRO ONLY — Suggests trending/missing topics.
 */
const suggestFillerTopics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { clerkId } = req.body;

        // Check pro status
        const user = await User.findOne({ clerkId });
        if (!user || user.plan !== 'pro') {
            return res.status(403).json({ success: false, message: "This feature requires a Pro plan." });
        }

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Playlist course not found" });
        }

        // Need topic analysis first
        let analysis = course.topicAnalysis;
        if (!analysis || !analysis.topicBlocks) {
            // Auto-run analysis
            const videoTitles = [];
            course.days.forEach(day => day.videos.forEach(v => videoTitles.push(v.title)));
            const { analyzePlaylistTopics } = require('../utils/playlistAnalyzer');
            analysis = await analyzePlaylistTopics(videoTitles, course.course_title);
            course.topicAnalysis = analysis;
            await course.save();
        }

        const { suggestMissingTopics } = require('../utils/playlistAnalyzer');
        const suggestions = await suggestMissingTopics(course.course_title, analysis.topicBlocks);

        return res.json({ success: true, suggestions });
    } catch (error) {
        console.error("Error in suggestFillerTopics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /:courseId/playlist/add-fillers
 * PRO ONLY — Finds videos for selected topics and adds them as filler days.
 * Body: { clerkId, selectedTopics: [{ topicName, subtopics: [{ title, youtubeQuery }] }] }
 */
const addFillerTopics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { clerkId, selectedTopics } = req.body;

        const user = await User.findOne({ clerkId });
        if (!user || user.plan !== 'pro') {
            return res.status(403).json({ success: false, message: "Pro plan required" });
        }

        if (!selectedTopics || selectedTopics.length === 0) {
            return res.status(400).json({ success: false, message: "No topics selected" });
        }

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Playlist course not found" });
        }

        // Respond immediately, process in background
        res.json({ success: true, message: "Filler topics are being processed. Check back in a moment." });

        // Background processing
        (async () => {
            try {
                const { findBestVideo } = require('../routes/videoFinder');
                const maxSecondsPerDay = Math.max(course.hoursPerDay, 0.5) * 3600;

                for (const topic of selectedTopics) {
                    const fillerVideos = [];

                    for (const sub of topic.subtopics) {
                        console.log(`🔍 Filler: searching video for "${sub.youtubeQuery}"`);
                        try {
                            const video = await findBestVideo(sub.youtubeQuery, []);
                            if (video) {
                                fillerVideos.push({
                                    videoId: video.id,
                                    title: video.title || sub.title,
                                    duration: video.duration || 0,
                                    channel: video.channelTitle || '',
                                    channelId: video.channelId || ''
                                });
                            }
                        } catch (e) {
                            console.error(`  ⚠️ Video search failed for "${sub.title}":`, e.message);
                        }
                    }

                    if (fillerVideos.length > 0) {
                        // Create filler day(s)
                        let currentDay = { dayNumber: course.days.length + 1, videos: [], totalDuration: 0, isFiller: true, fillerTopic: topic.topicName };

                        for (const video of fillerVideos) {
                            if (currentDay.totalDuration + video.duration > maxSecondsPerDay && currentDay.videos.length > 0) {
                                course.days.push(currentDay);
                                currentDay = { dayNumber: course.days.length + 1, videos: [], totalDuration: 0, isFiller: true, fillerTopic: topic.topicName };
                            }
                            currentDay.videos.push(video);
                            currentDay.totalDuration += video.duration;
                        }
                        if (currentDay.videos.length > 0) {
                            course.days.push(currentDay);
                        }
                    }
                }

                await course.save();
                console.log(`✅ Filler topics added: ${selectedTopics.length} topics → ${course.days.length} total days`);
            } catch (e) {
                console.error('❌ Background filler processing failed:', e);
            }
        })();

    } catch (error) {
        console.error("Error in addFillerTopics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ══════════════════════════════════════════════════
//  Daily Checkpoint System
// ══════════════════════════════════════════════════

/**
 * GET /:courseId/day/:dayIndex/checkpoint
 * Returns or generates the checkpoint for a specific day.
 */
const getCheckpoint = async (req, res) => {
    try {
        const { courseId, dayIndex } = req.params;
        const idx = parseInt(dayIndex, 10);

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const day = course.days[idx];
        if (!day) {
            return res.status(404).json({ success: false, message: "Day not found" });
        }

        // If checkpoint already has questions, return it
        if (day.checkpoint && day.checkpoint.theoryQuestions && day.checkpoint.theoryQuestions.length > 0) {
            return res.json({ success: true, checkpoint: day.checkpoint });
        }

        // Generate checkpoint
        const videoTitles = day.videos.map(v => v.title);
        const { generateCheckpoint } = require('../utils/checkpointGenerator');
        const result = await generateCheckpoint(videoTitles, course.course_title);

        // Save to day
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
        return res.json({ success: true, checkpoint: day.checkpoint });
    } catch (error) {
        console.error("Error in getCheckpoint:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /:courseId/day/:dayIndex/checkpoint/submit
 * Body: { clerkId, theoryAnswers: [...], codeFiles: [{ fileName, content }] }
 */
const submitCheckpoint = async (req, res) => {
    try {
        const { courseId, dayIndex } = req.params;
        const { clerkId, theoryAnswers, codeFiles } = req.body;
        const idx = parseInt(dayIndex, 10);

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'playlist') {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const day = course.days[idx];
        if (!day || !day.checkpoint) {
            return res.status(404).json({ success: false, message: "Day or checkpoint not found" });
        }

        // Determine max attempts based on user plan
        const user = await User.findOne({ clerkId });
        const maxAttempts = (user && user.plan === 'pro') ? 8 : 3;
        day.checkpoint.maxAttempts = maxAttempts;

        // Check attempts
        if (day.checkpoint.attemptsUsed >= maxAttempts) {
            // All attempts exhausted — unlock next day anyway
            if (day.checkpoint.status !== 'passed') {
                day.checkpoint.status = 'failed_all';
                // Unlock next day
                if (idx + 1 < course.days.length) {
                    course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                    if (course.days[idx + 1].checkpoint) {
                        course.days[idx + 1].checkpoint.status = 'available';
                    }
                }
                await course.save();
            }
            return res.status(400).json({
                success: false,
                message: "All attempts exhausted. Day has been unlocked anyway.",
                checkpoint: day.checkpoint
            });
        }

        // Grade with Gemini
        const { gradeCheckpoint } = require('../utils/checkpointGenerator');
        const gradeResult = await gradeCheckpoint({
            courseTitle: course.course_title,
            videoTitles: day.videos.map(v => v.title),
            questionType: day.checkpoint.questionType,
            theoryQuestions: day.checkpoint.theoryQuestions,
            theoryAnswers: theoryAnswers || [],
            codingQuestion: day.checkpoint.codingQuestion,
            codeFiles: codeFiles || []
        });

        // Save submission
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
            // Unlock next day
            if (idx + 1 < course.days.length) {
                course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                if (!course.days[idx + 1].checkpoint || course.days[idx + 1].checkpoint.status === 'locked') {
                    if (!course.days[idx + 1].checkpoint) {
                        course.days[idx + 1].checkpoint = { status: 'available' };
                    } else {
                        course.days[idx + 1].checkpoint.status = 'available';
                    }
                }
            }
            // Log activity
            try {
                await logActivity(course.userId, courseId, course.course_title, day.videos.length);
            } catch (e) { /* ignore */ }
        } else if (day.checkpoint.attemptsUsed >= maxAttempts) {
            day.checkpoint.status = 'failed_all';
            // Still unlock next day
            if (idx + 1 < course.days.length) {
                course.currentDayIndex = Math.max(course.currentDayIndex, idx + 1);
                if (!course.days[idx + 1].checkpoint) {
                    course.days[idx + 1].checkpoint = { status: 'available' };
                } else {
                    course.days[idx + 1].checkpoint.status = 'available';
                }
            }
        }

        await course.save();

        return res.json({
            success: true,
            passed,
            score: gradeResult.overallScore,
            attemptsRemaining: maxAttempts - day.checkpoint.attemptsUsed,
            feedback: gradeResult,
            checkpoint: day.checkpoint
        });
    } catch (error) {
        console.error("Error in submitCheckpoint:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    initializeCourse,
    updateTrustedCreators,
    markSubtopicCompleteAndUnlockNext,
    generateAndSaveQuiz,
    createCourseHandler,
    getUserCourses,
    getCourseById,
    markSubtopicWatched,
    gradeModuleQuiz,
    getModulePrepStatus,
    triggerPrepare,
    deleteCourseHandler,
    createFromPlaylist,
    getUserPlaylistCourses,
    analyzePlaylistCurriculum,
    removeOutdatedTopics,
    suggestFillerTopics,
    addFillerTopics,
    getCheckpoint,
    submitCheckpoint
};

