/**
 * ── Unified Credit System Configuration ──
 * Central source of truth for plan limits, action costs, and model routing.
 */

// ── Models ──
const MODELS = {
    FREE_MODEL: 'gemini-3.1-flash-lite',
    PREMIUM_MODEL: 'gemini-3-flash-preview',
};

// ── Plan Credit Allowances ──
const PLAN_CREDITS = {
    free: { allowance: 200, refillInterval: 'weekly' },
    pro: { allowance: 150, refillInterval: 'daily' },
    ultra: { allowance: 300, refillInterval: 'daily' },
};

// ── Action Credit Costs (Standard AI vs Advanced AI) ──   
const ACTION_COSTS = {
    courseScaffold: { standard: 5, advanced: 15 },
    playlistImport: { standard: 5, advanced: 15 },
    guidedLessonGeneration: { standard: 10, advanced: 30 },
    regenerateLesson: { standard: 10, advanced: 30 },
    blockRewrite: { standard: 2, advanced: 6 },
    quickBlockQuiz: { standard: 2, advanced: 6 },
    tutorChat: { standard: 1, advanced: 3 },
    practiceGeneration: { standard: 5, advanced: 20 },
    assessmentGrading: { standard: 5, advanced: 10 },
    imageAnswerGrade: { standard: 0, advanced: 5 },
    playlistCheckpointGeneration: { standard: 5, advanced: 15 },
    playlistCheckpointGrading: { standard: 5, advanced: 15 },
};

// ── Human-readable labels for each action (shown in transaction ledger) ──
const ACTION_LABELS = {
    courseScaffold: 'Generated course map',
    playlistImport: 'Imported YouTube playlist',
    guidedLessonGeneration: 'Generated lesson notes',
    regenerateLesson: 'Regenerated lesson notes',
    blockRewrite: 'Block rewrite',
    quickBlockQuiz: 'Quick block quiz',
    tutorChat: 'Tutor chat message',
    practiceGeneration: 'Generated practice test',
    assessmentGrading: 'Practice test grading + AI explanations',
    imageAnswerGrade: 'Image answer evaluation',
    playlistCheckpointGeneration: 'Playlist checkpoint generation',
    playlistCheckpointGrading: 'Playlist checkpoint grading',
};

// ── Features locked behind premium plans ──
const PREMIUM_LOCKED_FEATURES = {
    deepExplanation: { requiredPlan: 'pro', label: 'Deep Explanation Length' },
    codeQuestions: { requiredPlan: 'pro', label: 'Code Practice Questions' },
    miniProjects: { requiredPlan: 'pro', label: 'Mini Projects' },
    webGrounding: { requiredPlan: 'ultra', label: 'Web Grounding' },
};

// ── Study Control Limits (kept for lesson generation config) ──
const STUDY_CONTROL_LIMITS = {
    free: {
        explanationLengths: ['short', 'standard'],
        maxMcqCount: 3,
        maxWrittenCount: 1,
        maxCodeCount: 0,
        allowMiniProjects: false,
        allowWebGrounding: false,
        allowInteractiveWidgets: false
    },
    pro: {
        explanationLengths: ['short', 'standard', 'deep'],
        maxMcqCount: 8,
        maxWrittenCount: 3,
        maxCodeCount: 2,
        allowMiniProjects: true,
        allowWebGrounding: true,
        allowInteractiveWidgets: true
    },
    ultra: {
        explanationLengths: ['short', 'standard', 'deep'],
        maxMcqCount: 10,
        maxWrittenCount: 5,
        maxCodeCount: 3,
        allowMiniProjects: true,
        allowWebGrounding: true,
        allowInteractiveWidgets: true
    }
};

// ── Helpers ──
const VALID_PLANS = ['free', 'pro', 'ultra'];
const PLAN_TIERS = { free: 0, pro: 1, ultra: 2 };

const getNormalizedPlan = (plan) => VALID_PLANS.includes(plan) ? plan : 'free';

const getStudyControlLimits = (plan) => STUDY_CONTROL_LIMITS[getNormalizedPlan(plan)];

const getModelForPlan = (plan) => {
    const p = getNormalizedPlan(plan);
    return p === 'free' ? MODELS.FREE_MODEL : MODELS.PREMIUM_MODEL;
};

const getCostForAction = (plan, actionKey) => {
    const p = getNormalizedPlan(plan);
    const tier = p === 'free' ? 'standard' : 'advanced';
    const costs = ACTION_COSTS[actionKey];
    if (!costs) return 0;
    return costs[tier];
};

const getPlanCredits = (plan) => {
    const p = getNormalizedPlan(plan);
    return PLAN_CREDITS[p];
};

const meetsMinimumPlan = (userPlan, requiredPlan) => {
    return PLAN_TIERS[getNormalizedPlan(userPlan)] >= PLAN_TIERS[getNormalizedPlan(requiredPlan)];
};

module.exports = {
    MODELS,
    PLAN_CREDITS,
    ACTION_COSTS,
    ACTION_LABELS,
    PREMIUM_LOCKED_FEATURES,
    STUDY_CONTROL_LIMITS,
    getNormalizedPlan,
    getStudyControlLimits,
    getModelForPlan,
    getCostForAction,
    getPlanCredits,
    meetsMinimumPlan,
};
