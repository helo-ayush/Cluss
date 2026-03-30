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
    deleteCourseHandler
};
