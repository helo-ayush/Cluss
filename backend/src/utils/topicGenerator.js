const express = require('express');
const router = express.Router();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

const BROAD_TOPIC_HINTS = [
  'machine learning',
  'artificial intelligence',
  'data science',
  'web development',
  'frontend',
  'backend',
  'full stack',
  'cybersecurity',
  'cloud computing',
  'devops',
  'deep learning',
  'software engineering',
  'system design',
  'programming',
  'data structures',
  'algorithms',
  'dsa',
  'python',
  'java',
  'javascript',
  'react',
  'node',
  'c++'
];

function inferCurriculumTargets(rawQuery = '') {
  const query = String(rawQuery).trim().toLowerCase();
  const wordCount = query.split(/\s+/).filter(Boolean).length;
  const isBroadTopic =
    wordCount <= 3 ||
    BROAD_TOPIC_HINTS.some(hint => query.includes(hint));

  if (isBroadTopic) {
    return {
      isBroadTopic: true,
      minModules: 8,
      minSubtopics: 36,
      perModuleGuidance: '4 to 6 subtopics per module',
      depthLabel: 'comprehensive'
    };
  }

  return {
    isBroadTopic: false,
    minModules: 5,
    minSubtopics: 20,
    perModuleGuidance: '3 to 5 subtopics per module',
    depthLabel: 'detailed'
  };
}

function countSubtopics(curriculum) {
  return (curriculum?.modules || []).reduce(
    (total, mod) => total + ((mod?.subtopics || []).length),
    0
  );
}

function validateCurriculum(curriculum, targets) {
  if (!curriculum || !Array.isArray(curriculum.modules) || curriculum.modules.length === 0) {
    return { ok: false, reason: 'No modules were returned.' };
  }

  const moduleCount = curriculum.modules.length;
  const subtopicCount = countSubtopics(curriculum);

  if (moduleCount < targets.minModules) {
    return {
      ok: false,
      reason: `Curriculum too shallow: only ${moduleCount} modules, need at least ${targets.minModules}.`
    };
  }

  if (subtopicCount < targets.minSubtopics) {
    return {
      ok: false,
      reason: `Curriculum too shallow: only ${subtopicCount} subtopics, need at least ${targets.minSubtopics}.`
    };
  }

  const hasEmptyModule = curriculum.modules.some(
    mod => !Array.isArray(mod.subtopics) || mod.subtopics.length === 0
  );

  if (hasEmptyModule) {
    return {
      ok: false,
      reason: 'At least one module has no subtopics.'
    };
  }

  return { ok: true, moduleCount, subtopicCount };
}

function buildPrompt(learningGoal, targets, feedback = '') {
  return `Act as an expert curriculum designer, senior educator, and course architect.
Your task is to convert the user's learning goal into a deeply structured, sequential syllabus.
Do not return a short overview. Build a serious study roadmap with enough depth that the learner can progress from foundations to advanced practice.

Learning Goal: "${learningGoal}"

DEPTH REQUIREMENTS:
- This curriculum must be ${targets.depthLabel}, not a quick introduction.
- Generate at least ${targets.minModules} modules.
- Generate at least ${targets.minSubtopics} total subtopics.
- Aim for ${targets.perModuleGuidance}.
- For broad topics, cover prerequisites, foundations, core concepts, practical implementation, evaluation, debugging, projects, and advanced topics.
- Do not merge large ideas into one vague subtopic. Split them into teachable lesson-sized units.
- Module titles should represent major stages of mastery.
- Subtopics should be concrete enough that each one can map to a focused lesson or single tutorial video.

YOUTUBE QUERY RULES:
- Every subtopic must include a highly optimized youtube_search_query.
- Queries should be specific, tutorial-friendly, and aligned to the exact concept.
- Prefer search phrases that surface teaching videos, walkthroughs, or explainers.

LANGUAGE RULE:
- All output must be in English only.

CRITICAL OUTPUT RULES:
1. Output only valid JSON.
2. Do not include markdown code fences.
3. Do not include explanations outside the JSON.
4. Use the exact schema below.
5. Do not return a shallow outline.

JSON SCHEMA:
{
  "course_title": "String",
  "modules": [
    {
      "module_id": "Integer",
      "module_title": "String",
      "subtopics": [
        {
          "subtopic_id": "String or Number",
          "subtopic_title": "String",
          "youtube_search_query": "String"
        }
      ]
    }
  ]
}

${feedback ? `REVISION FEEDBACK FROM THE PREVIOUS ATTEMPT:\n${feedback}\n` : ''}

Generate the JSON syllabus now.`;
}

router.post('/', async (req, res) => {
  const learningGoal = req.body?.query?.trim();

  if (!learningGoal) {
    return res.status(400).json({ error: 'A learning goal is required.' });
  }

  try {
    console.log('Generating curriculum for query:', learningGoal);
    const targets = inferCurriculumTargets(learningGoal);
    let feedback = '';
    let lastRawText = '';

    for (let attempt = 1; attempt <= 2; attempt++) {
      const prompt = buildPrompt(learningGoal, targets, feedback);
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text();
      console.log(`Gemini Raw Response (attempt ${attempt}):`, text);

      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      lastRawText = text;

      try {
        const parsed = JSON.parse(text);
        const validation = validateCurriculum(parsed, targets);

        if (validation.ok) {
          console.log(
            `Curriculum accepted with ${validation.moduleCount} modules and ${validation.subtopicCount} subtopics.`
          );
          return res.json(parsed);
        }

        feedback = `${validation.reason} Expand the curriculum significantly while keeping it logically ordered and non-redundant.`;
        console.warn(`Curriculum rejected on attempt ${attempt}: ${validation.reason}`);
      } catch (parseErr) {
        feedback = 'The previous response was not valid JSON. Return only raw valid JSON using the required schema.';
        console.error('JSON Parse Error. Raw text was:', text);
      }
    }

    return res.status(500).json({
      error: 'AI generated a curriculum that was too shallow or invalid. Please try again.',
      details: lastRawText ? 'The model response failed curriculum validation.' : 'No valid response received.'
    });
  } catch (err) {
    console.error('Gemini API Error:', err);

    let errorMessage = 'Course generation failed.';
    if (err.message?.includes('429') || err.message?.includes('spending cap')) {
      errorMessage = 'API Quota Reached: Your project has exceeded its monthly spending cap. Please check your AI Studio settings at https://aistudio.google.com/app/settings';
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
