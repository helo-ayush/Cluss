const AI_ACTION_KEYS = [
    'guidedLessonGeneration',
    'blockRewrite',
    'quickBlockQuiz',
    'tutorChat',
    'assessmentGrading',
    'regenerateLesson',
    'playlistCheckpointGeneration',
    'playlistCheckpointGrading'
];

const PLAN_LIMITS = {
    free: {
        maxCourses: 3,
        coursesPerWeek: 1,
        topicUnlocksPerCoursePerDay: 1,
        quizPassThreshold: 80,
        aiActionsPerDay: {
            guidedLessonGeneration: 4,
            blockRewrite: 6,
            quickBlockQuiz: 4,
            tutorChat: 10,
            assessmentGrading: 6,
            regenerateLesson: 1,
            playlistCheckpointGeneration: 4,
            playlistCheckpointGrading: 6
        }
    },
    pro: {
        maxCourses: 10,
        coursesPerWeek: 5,
        topicUnlocksPerCoursePerDay: 3,
        quizPassThreshold: 70,
        aiActionsPerDay: {
            guidedLessonGeneration: 25,
            blockRewrite: 40,
            quickBlockQuiz: 25,
            tutorChat: 50,
            assessmentGrading: 35,
            regenerateLesson: 8,
            playlistCheckpointGeneration: 20,
            playlistCheckpointGrading: 35
        }
    },
    ultra: {
        maxCourses: 50,
        coursesPerWeek: 15,
        topicUnlocksPerCoursePerDay: 10,
        quizPassThreshold: 60,
        aiActionsPerDay: {
            guidedLessonGeneration: 80,
            blockRewrite: 160,
            quickBlockQuiz: 100,
            tutorChat: 240,
            assessmentGrading: 120,
            regenerateLesson: 30,
            playlistCheckpointGeneration: 70,
            playlistCheckpointGrading: 120
        }
    }
};

const CREATION_CATEGORIES = {
    guided: {
        sourceType: 'guided-topic',
        singularLabel: 'guided study plan',
        pluralLabel: 'guided study plans',
        upgradeTarget: 'Pro'
    },
    playlist: {
        sourceType: 'playlist',
        singularLabel: 'playlist study plan',
        pluralLabel: 'playlist study plans',
        upgradeTarget: 'Pro'
    }
};

const STUDY_CONTROL_LIMITS = {
    free: {
        explanationLengths: ['short', 'standard'],
        maxMcqCount: 3,
        maxWrittenCount: 1,
        maxCodeCount: 0,
        allowMiniProjects: false,
        allowWebGrounding: false
    },
    pro: {
        explanationLengths: ['short', 'standard', 'deep'],
        maxMcqCount: 8,
        maxWrittenCount: 3,
        maxCodeCount: 2,
        allowMiniProjects: true,
        allowWebGrounding: true
    },
    ultra: {
        explanationLengths: ['short', 'standard', 'deep'],
        maxMcqCount: 10,
        maxWrittenCount: 5,
        maxCodeCount: 3,
        allowMiniProjects: true,
        allowWebGrounding: true
    }
};

const ACTION_LABELS = {
    guidedLessonGeneration: 'guided lesson generations',
    blockRewrite: 'block rewrites',
    quickBlockQuiz: 'quick block quizzes',
    tutorChat: 'AI tutor messages',
    assessmentGrading: 'assessment reviews',
    regenerateLesson: 'lesson regenerations',
    playlistCheckpointGeneration: 'playlist checkpoint generations',
    playlistCheckpointGrading: 'playlist checkpoint reviews'
};

const getNormalizedPlan = (plan) => PLAN_LIMITS[plan] ? plan : 'free';

const getPlanLimits = (plan) => PLAN_LIMITS[getNormalizedPlan(plan)];

const getStudyControlLimits = (plan) => STUDY_CONTROL_LIMITS[getNormalizedPlan(plan)];

const getActionLimit = (plan, actionKey) => {
    const limits = getPlanLimits(plan);
    return limits.aiActionsPerDay[actionKey] ?? 0;
};

module.exports = {
    AI_ACTION_KEYS,
    ACTION_LABELS,
    PLAN_LIMITS,
    CREATION_CATEGORIES,
    STUDY_CONTROL_LIMITS,
    getActionLimit,
    getNormalizedPlan,
    getPlanLimits,
    getStudyControlLimits
};
