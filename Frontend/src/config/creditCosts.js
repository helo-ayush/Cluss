export const ACTION_COSTS = {
    courseScaffold:               { standard: 5,  advanced: 15 },
    playlistImport:              { standard: 5,  advanced: 15 },
    guidedLessonGeneration:      { standard: 10, advanced: 30 },
    regenerateLesson:            { standard: 10, advanced: 30 },
    blockRewrite:                { standard: 2,  advanced: 6  },
    quickBlockQuiz:              { standard: 2,  advanced: 6  },
    tutorChat:                   { standard: 1,  advanced: 3  },
    practiceGeneration:          { standard: 5,  advanced: 20 },
    assessmentGrading:           { standard: 5,  advanced: 10 },
    imageAnswerGrade:            { standard: 0,  advanced: 5  },
    playlistCheckpointGeneration:{ standard: 5,  advanced: 15 },
    playlistCheckpointGrading:   { standard: 5,  advanced: 15 },
};

export const getCostForAction = (plan, actionKey, explanationLength = 'standard') => {
    const p = ['free', 'pro', 'ultra'].includes(plan) ? plan : 'free';

    if (actionKey === 'guidedLessonGeneration' || actionKey === 'regenerateLesson') {
        const length = explanationLength || 'standard';
        if (p === 'free') {
            if (length === 'short') return 10;
            return 20; // standard
        } else if (p === 'pro' || p === 'ultra') {
            if (length === 'short') return 40;
            if (length === 'deep') return 60;
            return 50; // standard
        }
    }

    const tier = p === 'free' ? 'standard' : 'advanced';
    const costs = ACTION_COSTS[actionKey];
    if (!costs) return 0;
    return costs[tier];
};
