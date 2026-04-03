const Course = require('../models/Course');
const { findBestVideo } = require('../routes/videoFinder');
const { generateQuizFromTranscript } = require('./quizGenerator');

/**
 * Background worker: Prepares all subtopics in a module by finding videos and generating quizzes.
 * This runs in a fire-and-forget fashion — errors are caught per-subtopic.
 *
 * @param {String} courseId - The MongoDB course ID
 * @param {Number} moduleIndex - The module to prepare
 * @param {Array} trustedCreators - User's preferred YouTube channel IDs
 */
async function prepareModule(courseId, moduleIndex, trustedCreators = []) {
    console.log(`\n🔧 [ModulePreparer] Starting preparation for course ${courseId}, module ${moduleIndex}...`);

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            console.error(`[ModulePreparer] Course ${courseId} not found.`);
            return;
        }

        const targetModule = course.modules[moduleIndex];
        if (!targetModule) {
            console.error(`[ModulePreparer] Module index ${moduleIndex} not found.`);
            return;
        }

        // Mark module as preparing
        targetModule.prepStatus = 'preparing';
        await course.save();

        const subtopics = targetModule.subtopics;

        // Process all subtopics sequentially
        let failuresCount = 0;

        for (let subIdx = 0; subIdx < subtopics.length; subIdx++) {
            const subtopic = subtopics[subIdx];
            const searchQuery = subtopic.Youtube_query || subtopic.subtopic_title;
            console.log(`  📹 [Sub ${subIdx}] Searching video for: "${searchQuery}"`);

            try {
                // Step 1: Find best video
                const video = await findBestVideo(searchQuery, trustedCreators);

                if (video) {
                    subtopic.videoId = video.id || '';
                    subtopic.videoTitle = video.title || '';
                    subtopic.channelTitle = video.channelTitle || '';
                    subtopic.transcript = video.transcript || '';
                    console.log(`  ✅ [Sub ${subIdx}] Found video: ${video.title}`);

                    // Unlock subtopic if locked
                    if (subtopic.status === 'locked') {
                        subtopic.status = 'active';
                    }

                    // 🚀 CRITICAL OPTIMIZATION: Save immediately so the frontend can start playing the video!
                    await course.save();
                    console.log(`  💾 [Sub ${subIdx}] Video assigned. Frontend can now play it!`);

                    // Step 2: Generate quiz (takes ~10s, happens silently while user can already watch video)
                    console.log(`  🧠 [Sub ${subIdx}] Generating quiz in background...`);
                    const quiz = await generateQuizFromTranscript(subtopic.subtopic_title, video.transcript);
                    if (quiz && Array.isArray(quiz)) {
                        subtopic.quiz = quiz;
                        console.log(`  ✅ [Sub ${subIdx}] Quiz generated (${quiz.length} questions)`);
                    } else {
                        console.log(`  ⚠️ [Sub ${subIdx}] Quiz generation returned null`);
                    }
                } else {
                    // Mark as searched-but-not-found so future checks don't re-trigger
                    subtopic.videoId = 'none';
                    if (subtopic.status === 'locked') {
                        subtopic.status = 'active';
                    }
                    console.log(`  ❌ [Sub ${subIdx}] No suitable video found for: "${searchQuery}"`);
                }

                // Final save for this subtopic to lock in the quiz (or the "not found" status)
                await course.save();
                console.log(`  💾 [Sub ${subIdx}] Final subtopic progress saved (Quiz complete).`);

            } catch (err) {
                failuresCount++;
                console.error(`  ⚠️ [Sub ${subIdx}] Error:`, err.message || err);
            }
        }

        // Mark module as ready
        targetModule.prepStatus = failuresCount === subtopics.length ? 'failed' : 'ready';

        // Save all changes
        await course.save();
        console.log(`🔧 [ModulePreparer] Module ${moduleIndex} preparation complete! Status: ${targetModule.prepStatus}\n`);

    } catch (error) {
        console.error(`[ModulePreparer] Fatal error:`, error);
        // Try to mark as failed
        try {
            const course = await Course.findById(courseId);
            if (course && course.modules[moduleIndex]) {
                course.modules[moduleIndex].prepStatus = 'failed';
                await course.save();
            }
        } catch (e) { /* ignore */ }
    }
}

module.exports = { prepareModule };
