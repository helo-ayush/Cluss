const { GoogleGenAI } = require('@google/genai');
const { getStudyControlLimits, getModelForPlan } = require('../config/creditConfig');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sanitizeStudyConfig(requestedConfig = {}, userPlan = 'free') {
    const limits = getStudyControlLimits(userPlan);

    const explanationLength = limits.explanationLengths.includes(requestedConfig.explanationLength)
        ? requestedConfig.explanationLength
        : (limits.explanationLengths.includes('standard') ? 'standard' : limits.explanationLengths[0]);

    const mcqEnabled = requestedConfig.mcqEnabled !== false;
    const writtenEnabled = requestedConfig.writtenEnabled !== false;
    const codeEnabled = limits.maxCodeCount > 0 && requestedConfig.codeEnabled === true;
    const miniProjectsEnabled = limits.allowMiniProjects && requestedConfig.miniProjectsEnabled === true;
    const webGroundingEnabled = limits.allowWebGrounding && requestedConfig.webGroundingEnabled === true;
    const interactiveWidgets = limits.allowInteractiveWidgets && requestedConfig.interactiveWidgets === true;

    return {
        goal: (requestedConfig.goal || '').trim(),
        level: ['beginner', 'intermediate', 'advanced'].includes(requestedConfig.level) ? requestedConfig.level : 'beginner',
        explanationLength,
        mcqEnabled,
        mcqCount: mcqEnabled ? Math.max(0, Math.min(Number(requestedConfig.mcqCount ?? 3), limits.maxMcqCount)) : 0,
        writtenEnabled,
        writtenCount: writtenEnabled ? Math.max(0, Math.min(Number(requestedConfig.writtenCount ?? 1), limits.maxWrittenCount)) : 0,
        codeEnabled,
        codeCount: codeEnabled ? Math.max(0, Math.min(Number(requestedConfig.codeCount ?? 1), limits.maxCodeCount)) : 0,
        miniProjectsEnabled,
        miniProjectMode: miniProjectsEnabled && requestedConfig.miniProjectMode === 'every-module' ? 'every-module' : 'auto',
        webGroundingEnabled,
        interactiveWidgets
    };
}

async function generateGuidedScaffold({ topic, syllabus = '', config, userPlan = 'free' }) {
    const hasSyllabus = syllabus.trim().length > 0;
    
    const prompt = `
You are designing a guided study plan for the topic "${topic}".

Student profile:
- Goal: ${config.goal || 'General mastery'}
- Skill level: ${config.level}
- Explanation depth preference: ${config.explanationLength}
- Mini projects enabled: ${config.miniProjectsEnabled ? 'yes' : 'no'}
- Mini project mode: ${config.miniProjectMode}

${hasSyllabus ? `
PROVIDED CUSTOM SYLLABUS / OUTLINE:
"""
${syllabus}
"""
CRITICAL INSTRUCTION: You must strictly base the study modules and subtopics on the syllabus provided above. 
Use the provided syllabus as the absolute source of truth for the curriculum structure. Break it down logically into the required module/subtopic format.
` : ''}

Requirements:
1. Create 4 to 6 modules.
2. Each module should have 3 to 5 subtopics.
3. Keep subtopics concrete and teachable as single study units.
4. If mini projects are enabled and the topic supports applied practice, mark selected subtopics as "mini-project".
5. Use "lesson" for normal subtopics.
6. Insert mini projects only where meaningful.
7. Output ONLY valid JSON. Do not use markdown blocks like \`\`\`json. Return the raw JSON directly.

Expected format:
{
  "course_title": "string",
  "modules": [
    {
      "module_id": 1,
      "module_title": "string",
      "subtopics": [
        {
          "subtopic_id": "1.1",
          "subtopic_title": "string",
          "subtopic_type": "lesson" | "mini-project"
        }
      ]
    }
  ]
}
`;

    const apiConfig = {};
    if (config.webGroundingEnabled) {
        apiConfig.tools = [{ googleSearch: {} }];
    } else {
        apiConfig.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: apiConfig
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/^```json/mi, '').replace(/```$/mi, '').trim();
    return JSON.parse(rawText);
}

const blockIdFrom = (index) => `block-${String(index + 1).padStart(2, '0')}`;

function normalizeGeneratedBlocks(blocks = []) {
    const allowedTypes = ['intro', 'concept', 'diagram', 'example', 'code', 'callout', 'summary', 'project', 'practice'];
    return (Array.isArray(blocks) ? blocks : [])
        .map((block, index) => ({
            blockId: block.blockId || blockIdFrom(index),
            type: allowedTypes.includes(block.type) ? block.type : 'concept',
            title: block.title || `Study block ${index + 1}`,
            body: block.body || '',
            code: block.code || '',
            language: block.language || '',
            callout: block.callout || '',
            blockSummary: block.blockSummary || '',
            widgetPrompt: block.widgetPrompt || '',
            revisionHistory: []
        }))
        .filter((block) => block.title || block.body || block.code || block.callout);
}

async function generateGuidedSubtopicContent({ courseTitle, topic, moduleTitle, subtopicTitle, subtopicType, config, userPlan = 'free' }) {
    console.log('--- DEBUG: Generating Lesson ---');
    console.log('Topic:', topic);
    console.log('User Plan:', userPlan);
    console.log('Interactive Widgets Enabled:', config.interactiveWidgets);
    
    const isProject = subtopicType === 'mini-project';

    const prompt = `
You are creating a comprehensive, highly visual, notes-first guided lesson for the study plan "${courseTitle}" on the overall topic "${topic}".

Current module: "${moduleTitle}"
Current subtopic: "${subtopicTitle}"
Subtopic type: "${subtopicType}"
Student level: ${config.level}

${isProject ? `
Requirements for Mini-Project Blueprint:
1. Since this is a mini-project, DO NOT generate standard academic notes. Instead, generate a highly detailed "Project Blueprint" for the student to build locally.
2. Break the blueprint into clear blocks:
   - "intro": Project overview, real-world use case, and what they will build.
   - "concept": Core requirements, constraints, and prerequisites.
   - "diagram": A visual architecture or workflow diagram using Mermaid.
   - "code": Essential starter code, scaffolding, or configuration files needed to begin.
   - "project": A detailed, step-by-step implementation guide (use bolded numbered lists).
   - "summary": How to verify/test the project and the expected final outcome.
3. The goal is to give the student a complete roadmap to successfully build this on their own, acting as a structured guide rather than a test.
` : `
Requirements for Depth and Completeness:
1. Explain everything comprehensively. Focus on high-quality, structured explanations. Be deep but efficient—avoid fluff that might hit token limits.
2. Structure the content into 4-6 distinct blocks (concepts, examples, etc).
2. Teach like a patient big brother explaining to a beginner: start from basics, use simple words, then slowly introduce jargon. Provide "why this matters" context.
3. Break notes into clear, focused blocks. Use multiple "concept", "example", and "callout" blocks to build understanding step-by-step.
`}

Requirements for Visual & Rich Formatting (CRITICAL):
1. USE MERMAID DIAGRAMS: Wherever a concept has a flow, hierarchy, architecture, or relationship, include a Mermaid diagram in the block's \`body\` field.
   - Use \`\`\`mermaid ... \`\`\` syntax.
   - Types: DO NOT USE mindmap. Stick strictly to flowcharts (graph TD) and sequenceDiagram.
   - CRITICAL: In flowcharts, ALWAYS wrap node labels in double quotes. Example: \`A["You (The User)"]\` instead of \`A[You (The User)]\`.
   - CRITICAL: In sequenceDiagrams, ALWAYS wrap participant names in double quotes if they contain hyphens, dots, or spaces. Example: \`"create-next-app"\` instead of \`create-next-app\`.
   - CRITICAL: NEVER put spaces inside the shape brackets. Use \`A["Text"]\` NOT \`A[ "Text" ]\`, use \`B{"Text"}\` NOT \`B{ "Text" }\`.
   - Diagrams must be syntactically valid.
2. USE COMPARISON TABLES: When explaining multiple related concepts (e.g. INNER vs LEFT JOIN), use Markdown tables.
3. USE STRUCTURED CALLOUTS: Use blockquotes in the \`body\` for special notes:
   - \`> 💡 Key insight: [text]\`
   - \`> ⚠️ Common mistake: [text]\`
   - \`> 🔗 Real-world analogy: [text]\`
4. USE NUMBERED FLOWS: For step-by-step processes, use bolded numbered lists.
5. Code blocks must be separated into the "code" field, not buried inside body markdown.
6. Output ONLY valid JSON. Do not use markdown blocks like \`\`\`json. Return the raw JSON directly.

INLINE MINI CHALLENGES:
You can embed interactive, no-compiler coding challenges directly into the lesson to test the user's understanding. Use this for 1-2 blocks per lesson where active recall is useful.
There are two types of challenges:
1. "fill-in-the-blank": You provide a codeTemplate with exactly ONE missing piece represented by "___". The user must type the exact missing string.
   - Example codeTemplate: "def greet(name):\n    print('Hello, ' + ___)"
   - Example expectedAnswer: "name"
2. "guess-output": You provide working code. The user must type exactly what the code will output when run.
   - Example codeTemplate: "x = 5\nprint(x * 2)"
   - Example expectedAnswer: "10"

Rules for inlineChallenge:
- expectedAnswer must be a short, deterministic string (no spaces padding).
- Do not use for every block. Only where coding practice makes sense.

Expected format:
{
  "lessonContent": {
    "overview": "string",
    "explanation": "markdown string (can include diagrams/tables)",
    "example": "markdown string",
    "summary": "string",
    "practiceTip": "string",
    "keyPoints": ["string"],
    "pdfTitle": "string",
    "generatedForLevel": "string",
    "notesVersion": 2,
    "blocks": [
      {
        "blockId": "block-01",
        "type": "intro" | "concept" | "diagram" | "example" | "code" | "callout" | "summary" | "project" | "practice",
        "title": "string",
        "body": "markdown string (INCLUDE MERMAID/TABLES/CALLOUTS HERE)",
        "code": "string",
        "language": "string",
        "callout": "string",
        "blockSummary": "string",
        "inlineChallenge": {
          "type": "fill-in-the-blank" | "guess-output",
          "question": "string (the instruction for the user)",
          "codeTemplate": "string (the code with '___' for fill-in-the-blank, or full code for guess-output)",
          "expectedAnswer": "string (exact match string)",
          "hint": "string"
        }
      }
    ],
    "citations": []
  }
}
`;

    const apiConfig = {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
        temperature: 0.7,
    };
    if (config.webGroundingEnabled) {
        apiConfig.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: apiConfig
    });

    // Quick diagnostic: check if widgetPrompts made it through
    try {
        const quickPeek = JSON.parse(response.text || '{}');
        const blocks = quickPeek?.lessonContent?.blocks || [];
        const withWidgets = blocks.filter(b => b.widgetPrompt && b.widgetPrompt.trim());
        console.log(`[Widget Check] ${withWidgets.length}/${blocks.length} blocks have widgetPrompt (interactiveWidgets=${config.interactiveWidgets})`);
        if (withWidgets.length > 0) {
            withWidgets.forEach(b => console.log(`  -> [${b.blockId}] ${b.widgetPrompt.slice(0, 80)}...`));
        }
    } catch (_) { /* ignore peek errors, the real parse happens below */ }

    let rawText = '';
    try {
        rawText = response.text || '';
        // The new SDK response might be nested or need awaiting depending on the exact version
        if (typeof response.text === 'function') {
            rawText = await response.text();
        }
        
        rawText = rawText.replace(/^```json/mi, '').replace(/```$/mi, '').trim();
        if (!rawText) throw new Error('AI returned an empty response');
        
        const parsed = JSON.parse(rawText);
        parsed.lessonContent = parsed.lessonContent || {};
        parsed.lessonContent.blocks = normalizeGeneratedBlocks(parsed.lessonContent.blocks);
        parsed.lessonContent.notesVersion = 2;
        parsed.lessonContent.generatedForLevel = config.level;
        parsed.lessonContent.pdfTitle = parsed.lessonContent.pdfTitle || `${subtopicTitle} Notes`;
        return parsed;
    } catch (err) {
        console.error('JSON Parse Error. Raw text:', rawText);
        throw new Error(`Failed to parse lesson content: ${err.message}`);
    }
}

async function generatePracticeSheet({ courseTitle, moduleTitle, subtopicTitle, lessonContext, config, userPlan = 'free' }) {
    const prompt = `
You are generating a highly targeted practice sheet for the study plan "${courseTitle}".

Module: "${moduleTitle}"
Subtopic: "${subtopicTitle}"

Syllabus Context (what the student has learned so far):
${lessonContext}

Requirements:
1. Generate practice questions strictly based on the provided syllabus context. DO NOT ask about concepts that are not covered in the context.
2. If the topic is introductory (like "What is a DBMS?"), ask conceptual questions, not advanced coding or syntax questions.
3. Generate ${config.mcqCount || 3} MCQs with correct answers and explanations.
4. Generate ${config.writtenCount || 1} written questions with rubric bullet points.
5. If code is enabled (${config.codeEnabled ? 'yes' : 'no'}), generate ${config.codeCount || 0} code tasks ONLY if the context naturally supports coding. Otherwise omit them.
6. Output ONLY valid JSON. Do not use markdown blocks like \`\`\`json. Return the raw JSON directly.

Expected format:
{
  "mcqs": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string",
      "hint": "string"
    }
  ],
  "written": [
    {
      "question": "string",
      "rubric": ["string"]
    }
  ],
  "code": [
    {
      "prompt": "string",
      "language": "string",
      "starterCode": "string",
      "rubric": ["string"]
    }
  ]
}
`;

    const apiConfig = {};
    if (config && config.webGroundingEnabled) {
        apiConfig.tools = [{ googleSearch: {} }];
    } else {
        apiConfig.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: apiConfig
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/^```json/mi, '').replace(/```$/mi, '').trim();
    return JSON.parse(rawText);
}

async function rewriteGuidedLessonBlock({
    courseTitle,
    topic,
    moduleTitle,
    subtopicTitle,
    block,
    action,
    selectedText = '',
    userPlan = 'free'
}) {
    const actionInstructions = {
        'explain-briefly': 'Expand and clarify this exact block with more detail, better intuition, and beginner-friendly examples. Keep it focused on this block only.',
        simplify: 'Rewrite this exact block in simpler language for a beginner. Keep the meaning accurate and avoid adding unrelated topics.',
        'give-example': 'Keep the original explanation and add one concrete example inside this block only.',
        'quiz-me': 'Create 1-2 quick practice questions for this block only. Do not rewrite the whole lesson.'
    };

    const prompt = `
You are improving one selected note block inside a guided lesson. Do not touch any other lesson block.

Study plan: "${courseTitle}"
Overall topic: "${topic}"
Module: "${moduleTitle}"
Subtopic: "${subtopicTitle}"
User plan: ${userPlan}
Action: ${action}
Selected text, if any: ${selectedText || 'None'}

Current block:
${JSON.stringify(block, null, 2)}

Instruction:
${actionInstructions[action] || actionInstructions['explain-briefly']}

Tone:
- Patient big-bro tutor.
- Start from basics.
- Make the idea easier to understand.
- Keep scope limited to this block.
- Put code only in the "code" field.

Output only valid JSON:
{
  "type": "intro" | "concept" | "example" | "code" | "callout" | "summary" | "project" | "practice",
  "title": "string",
  "body": "markdown string",
  "code": "string",
  "language": "string",
  "callout": "string",
  "blockSummary": "string"
}
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text);
    return {
        type: ['intro', 'concept', 'example', 'code', 'callout', 'summary', 'project', 'practice'].includes(parsed.type) ? parsed.type : block.type || 'concept',
        title: parsed.title || block.title,
        body: parsed.body || block.body || '',
        code: parsed.code || '',
        language: parsed.language || block.language || '',
        callout: parsed.callout || '',
        blockSummary: parsed.blockSummary || block.blockSummary || ''
    };
}

async function gradeGuidedSubmission({
    topic,
    moduleTitle,
    subtopicTitle,
    lessonContent,
    assessmentBundle,
    submission
}) {
    const prompt = `
You are grading a guided learning checkpoint.

Overall topic: "${topic}"
Module: "${moduleTitle}"
Subtopic: "${subtopicTitle}"

Lesson summary:
${lessonContent.summary || ''}

Assessment bundle:
${JSON.stringify(assessmentBundle, null, 2)}

Student submission:
${JSON.stringify(submission, null, 2)}

Rules:
1. MCQs are already auto-gradable; treat them as objective.
2. Grade written and code answers fairly but rigorously.
3. Score each written answer 0-100.
4. Score each code answer 0-100.
5. Give concise feedback and a short mistake log.
6. Output only valid JSON.

Expected format:
{
  "score": 0,
  "passed": false,
  "summary": "string",
  "mistakes": ["string"],
  "coaching": "markdown string",
  "writtenFeedback": [
    { "index": 0, "score": 72, "feedback": "string" }
  ],
  "codeFeedback": [
    { "index": 0, "score": 81, "feedback": "string" }
  ],
  "overallFeedback": "string",
  "mistakeLog": ["string"]
}
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan('free'),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
}

async function generateSyllabusDiff({ courseTitle, currentModules, instruction, userPlan = 'free' }) {
    const syllabusText = currentModules.map((m, mi) =>
        `Module ${mi}: ${m.module_title}\n` +
        (m.subtopics || []).map((s, si) =>
            `  [moduleIndex=${mi}, subtopicIndex=${si}] ${s.subtopic_title} (${s.subtopic_type})`
        ).join('\n')
    ).join('\n\n');

    const prompt = `
You are an intelligent syllabus editor for the study plan "${courseTitle}".

Current syllabus (indices are 0-based):
${syllabusText}

User instruction: "${instruction}"

Your job: determine what to add or remove based on the instruction.
Rules:
1. Do NOT rename or reorder existing subtopics.
2. Do NOT hallucinate subtopic indices. Only reference subtopics that exist above.
3. For removes: use exact moduleIndex and subtopicIndex from the listing above.
4. For adds: specify which moduleIndex to insert into, and position (0-based index within that module's subtopics list).
5. If nothing needs changing, return empty arrays.

Output only valid JSON:
{
  "summary": "One sentence describing the changes made",
  "adds": [
    { "moduleIndex": 0, "position": 2, "subtopic_title": "string", "subtopic_type": "lesson" }
  ],
  "removes": [
    { "moduleIndex": 0, "subtopicIndex": 2, "subtopic_title": "string" }
  ]
}
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text);
}

module.exports = {
    sanitizeStudyConfig,
    generateGuidedScaffold,
    generateGuidedSubtopicContent,
    generatePracticeSheet,
    rewriteGuidedLessonBlock,
    gradeGuidedSubmission,
    generateSyllabusDiff
};
