const Course = require('../models/Course');
const User = require('../models/User');
const Activity = require('../models/Activity');
const {
    generateGuidedScaffold,
    generateGuidedSubtopicContent,
    gradeGuidedSubmission,
    rewriteGuidedLessonBlock,
    sanitizeStudyConfig,
    generateSyllabusDiff
} = require('../services/guidedStudyGenerator');
const {
    serializeStudyPlan,
    summarizeStudyPlans
} = require('../services/studyPlanMetrics');
const { assertCredits, spendCredits, maybeRefillCredits } = require('../middleware/creditManager');

const logActivity = async (userId, courseId, courseTitle, count = 1) => {
    try {
        const dateStr = new Date().toISOString().slice(0, 10);
        const activity = await Activity.findOneAndUpdate(
            { userId, date: dateStr },
            {
                $inc: { subtopicsCompleted: count },
                $setOnInsert: { userId, date: dateStr }
            },
            { upsert: true, new: true }
        );

        const existingEntry = activity.courses.find(
            (entry) => entry.courseId?.toString() === courseId?.toString()
        );

        if (existingEntry) {
            existingEntry.count += count;
        } else {
            activity.courses.push({ courseId, courseTitle, count });
        }

        await activity.save();
    } catch (error) {
        console.error('logActivity error (guided, non-fatal):', error.message);
    }
};

const ensureUser = async ({ clerkId, userName }, existingUser) => {
    if (existingUser) return existingUser;

    let user = await User.findOne({ clerkId });
    if (!user) {
        user = await User.create({ clerkId, name: userName || 'Learner' });
    }

    return user;
};

const parseSubtopicRef = (subtopicRef) => {
    const [moduleIndexRaw, subtopicIndexRaw] = String(subtopicRef || '').split(':');
    const moduleIndex = Number.parseInt(moduleIndexRaw, 10);
    const subtopicIndex = Number.parseInt(subtopicIndexRaw, 10);

    if (Number.isNaN(moduleIndex) || Number.isNaN(subtopicIndex)) {
        return null;
    }

    return { moduleIndex, subtopicIndex };
};

const findSubtopic = (course, subtopicRef) => {
    const parsed = parseSubtopicRef(subtopicRef);
    if (!parsed) return null;

    const module = course.modules?.[parsed.moduleIndex];
    const subtopic = module?.subtopics?.[parsed.subtopicIndex];

    if (!module || !subtopic) return null;

    return { ...parsed, module, subtopic };
};

const recalculateCourseStatuses = (course) => {
    let hasFoundActive = false;
    for (const mod of (course.modules || [])) {
        for (const sub of (mod.subtopics || [])) {
            if (sub.status === 'completed') {
                continue;
            }
            if (!hasFoundActive) {
                sub.status = 'active';
                hasFoundActive = true;
                course.current_module_index = course.modules.indexOf(mod);
                course.current_subtopic_index = mod.subtopics.indexOf(sub);
            } else {
                sub.status = 'locked';
            }
        }
    }
};

const createGuidedStudyPlan = async (req, res) => {
    try {
        const { clerkId, topic, syllabus, goal, level, studyConfig, userName } = req.body;

        if (!clerkId || !topic?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'clerkId and topic are required'
            });
        }

        const user = await ensureUser({ clerkId, userName }, req.dbUser);
        await maybeRefillCredits(user);
        assertCredits(user, 'courseScaffold');

        const normalizedConfig = sanitizeStudyConfig(
            {
                ...studyConfig,
                goal: goal || studyConfig?.goal,
                level: level || studyConfig?.level
            },
            user.plan
        );

        const scaffold = await generateGuidedScaffold({
            topic: topic.trim(),
            syllabus: syllabus?.trim() || '',
            config: normalizedConfig,
            userPlan: user.plan
        });

        const modules = (scaffold.modules || []).map((module, moduleIndex) => ({
            module_id: module.module_id ?? moduleIndex + 1,
            module_title: module.module_title,
            prepStatus: 'pending',
            subtopics: (module.subtopics || []).map((subtopic, subtopicIndex) => ({
                subtopic_id: subtopic.subtopic_id ?? `${moduleIndex + 1}.${subtopicIndex + 1}`,
                subtopic_title: subtopic.subtopic_title,
                subtopic_type: subtopic.subtopic_type === 'mini-project' ? 'mini-project' : 'lesson',
                status: (moduleIndex === 0 && subtopicIndex === 0) ? 'active' : 'locked',
                generationStatus: 'pending'
            }))
        }));

        const course = await Course.create({
            userId: user._id,
            course_query: topic.trim(),
            course_title: scaffold.course_title || topic.trim(),
            sourceType: 'guided-topic',
            learningGoal: goal || topic.trim(),
            studyConfig: normalizedConfig,
            current_module_index: 0,
            current_subtopic_index: 0,
            modules
        });

        await spendCredits(user, 'courseScaffold');

        return res.json({
            success: true,
            course: serializeStudyPlan(course)
        });
    } catch (error) {
        console.error('Error in createGuidedStudyPlan:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Failed to create guided study plan'
        });
    }
};

const getStudyPlansForUser = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.json({
                success: true,
                courses: [],
                stats: {
                    totalCourses: 0,
                    completedSubtopics: 0,
                    totalSubtopics: 0
                }
            });
        }

        const courses = await Course.find({
            userId: user._id,
            sourceType: { $in: ['guided-topic', 'playlist'] }
        }).sort({ updatedAt: -1 });

        const summary = summarizeStudyPlans(courses);

        return res.json({
            success: true,
            courses: courses.map(serializeStudyPlan),
            stats: {
                totalCourses: summary.totalPlans,
                completedSubtopics: summary.completedSubtopics,
                totalSubtopics: summary.totalSubtopics
            }
        });
    } catch (error) {
        console.error('Error in getStudyPlansForUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch study plans',
            error: error.message
        });
    }
};

const getGuidedStudyPlansForUser = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.json({ success: true, courses: [] });
        }

        const courses = await Course.find({
            userId: user._id,
            sourceType: 'guided-topic'
        }).sort({ updatedAt: -1 });

        return res.json({ success: true, courses: courses.map(serializeStudyPlan) });
    } catch (error) {
        console.error('Error in getGuidedStudyPlansForUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch guided study plans',
            error: error.message
        });
    }
};

const getStudyPlanById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { clerkId } = req.query;
        const course = await Course.findById(courseId);

        if (!course || !['guided-topic', 'playlist'].includes(course.sourceType)) {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        // Creator verification (structured for future public courses feature)
        if (clerkId) {
            const user = await User.findOne({ clerkId });
            // If the course is NOT marked public, require ownership
            if (!course.isPublic && (!user || course.userId.toString() !== user._id.toString())) {
                return res.status(403).json({ success: false, message: 'Access denied: You are not the creator of this study plan.' });
            }
        } else if (!course.isPublic) {
            // No clerkId provided and course is private
            return res.status(401).json({ success: false, message: 'Authentication required to view this study plan.' });
        }

        return res.json({ success: true, course: serializeStudyPlan(course) });
    } catch (error) {
        console.error('Error in getStudyPlanById:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch study plan',
            error: error.message
        });
    }
};

const updateGuidedConfig = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studyConfig } = req.body;

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const user = await User.findById(course.userId);
        const normalizedConfig = sanitizeStudyConfig({
            ...course.studyConfig?.toObject?.(),
            ...(studyConfig || {})
        }, user?.plan);

        course.studyConfig = normalizedConfig;
        await course.save();

        return res.json({ success: true, course: serializeStudyPlan(course) });
    } catch (error) {
        console.error('Error in updateGuidedConfig:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update study plan settings',
            error: error.message
        });
    }
};

const generateSubtopicContent = async (req, res) => {
    try {
        const { courseId, subtopicId } = req.params;
        const { overrideConfig, regenerate = false } = req.body || {};

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const ref = findSubtopic(course, subtopicId);
        if (!ref) {
            return res.status(404).json({ success: false, message: 'Subtopic not found' });
        }

        const user = await User.findById(course.userId);
        const baseConfig = ref.subtopicOverrideConfig || course.studyConfig || {};
        const appliedConfig = sanitizeStudyConfig({
            ...baseConfig?.toObject?.(),
            ...(overrideConfig || {})
        }, user?.plan);

        if (!regenerate && ref.subtopic.generationStatus === 'ready' && ref.subtopic.lessonContent?.generatedAt) {
            return res.json({
                success: true,
                course: serializeStudyPlan(course),
                subtopic: ref.subtopic
            });
        }

        if (ref.subtopic.generationStatus === 'generating') {
            return res.status(409).json({
                success: false,
                message: 'Content is already being generated for this lesson. Please wait.'
            });
        }

        const usageAction = regenerate ? 'regenerateLesson' : 'guidedLessonGeneration';
        await maybeRefillCredits(user);
        assertCredits(user, usageAction);

        ref.subtopic.generationStatus = 'generating';
        await course.save();

        const generated = await generateGuidedSubtopicContent({
            courseTitle: course.course_title,
            topic: course.course_query || course.course_title,
            moduleTitle: ref.module.module_title,
            subtopicTitle: ref.subtopic.subtopic_title,
            subtopicType: ref.subtopic.subtopic_type,
            config: appliedConfig,
            userPlan: user?.plan
        });

        ref.subtopic.lessonContent = generated.lessonContent;
        ref.subtopic.lessonContent.generatedAt = new Date();
        ref.subtopic.appliedConfig = appliedConfig;
        ref.subtopic.subtopicOverrideConfig = overrideConfig ? appliedConfig : ref.subtopic.subtopicOverrideConfig;
        ref.subtopic.generationStatus = 'ready';
        ref.subtopic.status = 'completed';

        recalculateCourseStatuses(course);

        await course.save();
        await spendCredits(user, usageAction);
        await logActivity(user._id, course._id, course.course_title, 1);

        return res.json({
            success: true,
            course: serializeStudyPlan(course),
            subtopic: ref.subtopic
        });
    } catch (error) {
        console.error('Error in generateSubtopicContent:', error);
        try {
            const course = await Course.findById(req.params.courseId);
            const ref = course ? findSubtopic(course, req.params.subtopicId) : null;
            if (ref) {
                ref.subtopic.generationStatus = 'failed';
                await course.save();
            }
        } catch (secondaryError) {
            console.error('Secondary generateSubtopicContent error:', secondaryError.message);
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: 'Failed to generate lesson content',
            error: error.message
        });
    }
};

const rewriteGuidedBlock = async (req, res) => {
    try {
        const { courseId, subtopicId, blockId } = req.params;
        const { action = 'explain-briefly', selectedText = '' } = req.body || {};
        const allowedActions = ['explain-briefly', 'simplify', 'give-example', 'quiz-me'];
        const normalizedAction = allowedActions.includes(action) ? action : 'explain-briefly';

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const ref = findSubtopic(course, subtopicId);
        if (!ref) {
            return res.status(404).json({ success: false, message: 'Subtopic not found' });
        }

        const blocks = ref.subtopic.lessonContent?.blocks || [];
        const block = blocks.find((item) => item.blockId === blockId);
        if (!block) {
            return res.status(404).json({ success: false, message: 'Lesson block not found' });
        }

        const user = await User.findById(course.userId);
        const usageAction = normalizedAction === 'quiz-me' ? 'quickBlockQuiz' : 'blockRewrite';
        await maybeRefillCredits(user);
        assertCredits(user, usageAction);

        const previous = {
            title: block.title,
            body: block.body,
            code: block.code,
            language: block.language,
            callout: block.callout,
            blockSummary: block.blockSummary,
            action: normalizedAction,
            updatedAt: new Date()
        };

        const updatedBlock = await rewriteGuidedLessonBlock({
            courseTitle: course.course_title,
            topic: course.course_query || course.course_title,
            moduleTitle: ref.module.module_title,
            subtopicTitle: ref.subtopic.subtopic_title,
            block,
            action: normalizedAction,
            selectedText,
            userPlan: user?.plan || 'free'
        });

        block.revisionHistory = [...(block.revisionHistory || []), previous].slice(-8);
        block.type = updatedBlock.type;
        block.title = updatedBlock.title;
        block.body = updatedBlock.body;
        block.code = updatedBlock.code;
        block.language = updatedBlock.language;
        block.callout = updatedBlock.callout;
        block.blockSummary = updatedBlock.blockSummary;

        await course.save();
        await spendCredits(user, usageAction);

        return res.json({
            success: true,
            course: serializeStudyPlan(course),
            subtopic: ref.subtopic,
            block
        });
    } catch (error) {
        console.error('Error in rewriteGuidedBlock:', error);
        const status = error.statusCode || 500;
        return res.status(status).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Failed to rewrite lesson block'
        });
    }
};

const undoGuidedBlockRewrite = async (req, res) => {
    try {
        const { courseId, subtopicId, blockId } = req.params;
        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const ref = findSubtopic(course, subtopicId);
        if (!ref) {
            return res.status(404).json({ success: false, message: 'Subtopic not found' });
        }

        const block = (ref.subtopic.lessonContent?.blocks || []).find((item) => item.blockId === blockId);
        if (!block) {
            return res.status(404).json({ success: false, message: 'Lesson block not found' });
        }

        const history = block.revisionHistory || [];
        const previous = history.pop();
        if (!previous) {
            return res.status(400).json({ success: false, message: 'No previous block version to restore.' });
        }

        block.title = previous.title;
        block.body = previous.body;
        block.code = previous.code;
        block.language = previous.language;
        block.callout = previous.callout;
        block.blockSummary = previous.blockSummary;
        block.revisionHistory = history;

        await course.save();

        return res.json({
            success: true,
            course: serializeStudyPlan(course),
            subtopic: ref.subtopic,
            block
        });
    } catch (error) {
        console.error('Error in undoGuidedBlockRewrite:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to undo block rewrite',
            error: error.message
        });
    }
};

const submitGuidedAssessment = async (req, res) => {
    try {
        const { courseId, subtopicId } = req.params;
        const { submission, confidence = '', studentNotes = '', practiceIndex = 0 } = req.body;

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const ref = findSubtopic(course, subtopicId);
        if (!ref || ref.subtopic.generationStatus !== 'ready') {
            return res.status(400).json({ success: false, message: 'Subtopic not ready' });
        }

        const practice = ref.subtopic.practices[practiceIndex];
        if (!practice) {
            return res.status(404).json({ success: false, message: 'Practice sheet not found' });
        }
        if (practice.state.attemptsUsed > 0) {
            return res.status(400).json({ success: false, message: 'This practice sheet is already submitted.' });
        }

        const user = await User.findById(course.userId);
        await maybeRefillCredits(user);
        assertCredits(user, 'assessmentGrading'); // will be 0

        const { gradeGuidedSubmission } = require('../services/guidedStudyGenerator');
        const gradeResult = await gradeGuidedSubmission({
            topic: course.course_query || course.course_title,
            moduleTitle: ref.module.module_title,
            subtopicTitle: ref.subtopic.subtopic_title,
            lessonContent: ref.subtopic.lessonContent,
            assessmentBundle: practice.bundle,
            submission: submission || {}
        });

        practice.state.attemptsUsed += 1;
        practice.state.lastScore = gradeResult.score || 0;
        practice.state.passed = !!gradeResult.passed;
        practice.state.confidence = confidence || '';
        practice.state.feedback = gradeResult;
        practice.state.lastSubmission = submission || {};
        practice.state.completedAt = new Date();

        ref.subtopic.studentNotes = studentNotes || ref.subtopic.studentNotes || '';
        ref.subtopic.mistakeLog = gradeResult.mistakes || [];

        await course.save();
        await spendCredits(user, 'assessmentGrading');

        return res.json({
            success: true,
            passed: gradeResult.passed,
            feedback: gradeResult,
            course: serializeStudyPlan(course),
            subtopic: ref.subtopic
        });
    } catch (error) {
        console.error('Error in submitGuidedAssessment:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: 'Failed to review submission',
            error: error.message
        });
    }
};

const generateSubtopicPractice = async (req, res) => {
    try {
        const { courseId, subtopicId } = req.params;

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Guided study plan not found' });
        }

        const ref = findSubtopic(course, subtopicId);
        if (!ref || ref.subtopic.generationStatus !== 'ready') {
            return res.status(400).json({ success: false, message: 'Lesson must be generated first.' });
        }

        const user = await User.findById(course.userId);
        await maybeRefillCredits(user);
        assertCredits(user, 'practiceGeneration');

        const { generatePracticeSheet } = require('../services/guidedStudyGenerator');
        const lessonContext = ref.subtopic.lessonContent.blocks.map(b => b.title + ': ' + b.body).join('\n\n');
        const appliedConfig = ref.subtopic.appliedConfig || {};

        const practiceBundle = await generatePracticeSheet({
            courseTitle: course.course_title,
            moduleTitle: ref.module.module_title,
            subtopicTitle: ref.subtopic.subtopic_title,
            lessonContext,
            config: appliedConfig,
            userPlan: user.plan || 'free'
        });

        ref.subtopic.practices.push({
            bundle: practiceBundle,
            state: {
                attemptsUsed: 0,
                passed: false,
                lastScore: 0,
                feedback: null,
                lastSubmission: null
            },
            generatedAt: new Date()
        });

        await course.save();
        await spendCredits(user, 'practiceGeneration');

        return res.json({
            success: true,
            course: serializeStudyPlan(course),
            subtopic: ref.subtopic
        });
    } catch (error) {
        console.error('Error generating practice:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            message: 'Failed to generate practice sheet',
            error: error.message
        });
    }
};

const deleteStudyPlan = async (req, res) => {
    try {
        const { courseId } = req.params;
        const deleted = await Course.findByIdAndDelete(courseId);

        if (!deleted || !['guided-topic', 'playlist'].includes(deleted.sourceType)) {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error in deleteStudyPlan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete study plan',
            error: error.message
        });
    }
};

const tuneSyllabus = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { clerkId, instruction } = req.body;

        if (!instruction?.trim()) {
            return res.status(400).json({ success: false, message: 'Instruction is required' });
        }

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        const user = req.dbUser || await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await maybeRefillCredits(user);
        assertCredits(user, 'courseScaffold');

        const diff = await generateSyllabusDiff({
            courseTitle: course.course_title,
            currentModules: course.modules,
            instruction: instruction.trim(),
            userPlan: user.plan
        });

        // Spend credits immediately — Gemini already did the work
        await spendCredits(user, 'courseScaffold');

        return res.json({ success: true, diff });
    } catch (error) {
        console.error('Error in tuneSyllabus:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            creditError: !!error.creditError,
            creditInfo: error.creditInfo || null,
            message: error.message || 'Failed to process tuning instruction'
        });
    }
};

const confirmTune = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { apply, diff } = req.body;

        // If rejected, nothing to do
        if (!apply || !diff) {
            return res.json({ success: true, message: 'Changes rejected' });
        }

        const course = await Course.findById(courseId);
        if (!course || course.sourceType !== 'guided-topic') {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        // Process removes in reverse order (so indices stay valid)
        const removes = [...(diff.removes || [])].sort((a, b) => {
            if (a.moduleIndex !== b.moduleIndex) return b.moduleIndex - a.moduleIndex;
            return b.subtopicIndex - a.subtopicIndex;
        });

        for (const remove of removes) {
            const mod = course.modules[remove.moduleIndex];
            if (!mod) continue;
            // Splice out the subtopic — this deletes lessonContent, practices, everything nested
            mod.subtopics.splice(remove.subtopicIndex, 1);
        }

        // Process adds
        for (const add of (diff.adds || [])) {
            const mod = course.modules[add.moduleIndex];
            if (!mod) continue;
            const position = Math.min(add.position ?? mod.subtopics.length, mod.subtopics.length);
            const newSubtopic = {
                subtopic_id: `tuner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                subtopic_title: add.subtopic_title,
                subtopic_type: add.subtopic_type === 'mini-project' ? 'mini-project' : 'lesson',
                status: 'locked',
                generationStatus: 'pending',
                lessonContent: {},
                practices: []
            };
            mod.subtopics.splice(position, 0, newSubtopic);
        }

        // Ensure chronological states are perfectly calculated
        recalculateCourseStatuses(course);

        course.markModified('modules');
        await course.save();

        return res.json({ success: true, course: serializeStudyPlan(course) });
    } catch (error) {
        console.error('Error in confirmTune:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to apply syllabus changes',
            error: error.message
        });
    }
};

module.exports = {
    createGuidedStudyPlan,
    getStudyPlansForUser,
    getGuidedStudyPlansForUser,
    getStudyPlanById,
    updateGuidedConfig,
    generateSubtopicContent,
    generateSubtopicPractice,
    rewriteGuidedBlock,
    undoGuidedBlockRewrite,
    submitGuidedAssessment,
    deleteStudyPlan,
    tuneSyllabus,
    confirmTune
};
