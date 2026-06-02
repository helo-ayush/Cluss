export const DEFAULT_STUDY_CONFIG = {
  goal: '',
  level: 'beginner',
  explanationLength: 'standard',
  mcqEnabled: true,
  mcqCount: 3,
  writtenEnabled: false,
  writtenCount: 0,
  codeEnabled: false,
  codeCount: 0,
  miniProjectsEnabled: false,
  miniProjectMode: 'auto',
  webGroundingEnabled: false,
  interactiveWidgets: false,
};

export const FRONTEND_PLAN_LIMITS = {
  free: {
    mcqMax: 3,
    writtenMax: 1,
    codeMax: 0,
    canUseDeep: false,
    canUseCode: false,
    canUseMiniProjects: false,
    canUseWebGrounding: false,
    canUseInteractiveWidgets: false,
  },
  pro: {
    mcqMax: 8,
    writtenMax: 3,
    codeMax: 2,
    canUseDeep: true,
    canUseCode: true,
    canUseMiniProjects: true,
    canUseWebGrounding: true,
    canUseInteractiveWidgets: true,
  },
  ultra: {
    mcqMax: 10,
    writtenMax: 5,
    codeMax: 3,
    canUseDeep: true,
    canUseCode: true,
    canUseMiniProjects: true,
    canUseWebGrounding: true,
    canUseInteractiveWidgets: true,
  },
};

export const getPlanConfig = (plan) => FRONTEND_PLAN_LIMITS[plan] || FRONTEND_PLAN_LIMITS.free;

export const normalizeStudyConfig = (config, plan = 'free') => {
  const limits = getPlanConfig(plan);
  const next = { ...DEFAULT_STUDY_CONFIG, ...(config || {}) };

  if (!limits.canUseDeep && next.explanationLength === 'deep') {
    next.explanationLength = 'standard';
  }

  next.mcqCount = next.mcqEnabled ? Math.min(Math.max(Number(next.mcqCount) || 0, 0), limits.mcqMax) : 0;
  next.writtenEnabled = false;
  next.writtenCount = 0;

  if (!limits.canUseCode) {
    next.codeEnabled = false;
    next.codeCount = 0;
  } else {
    next.codeCount = next.codeEnabled ? Math.min(Math.max(Number(next.codeCount) || 0, 0), limits.codeMax) : 0;
  }

  if (!limits.canUseMiniProjects) {
    next.miniProjectsEnabled = false;
  }

  if (!limits.canUseWebGrounding) {
    next.webGroundingEnabled = false;
  }

  if (!limits.canUseInteractiveWidgets) {
    next.interactiveWidgets = false;
  }

  return next;
};
