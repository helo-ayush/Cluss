const { GoogleGenAI } = require('@google/genai');
const { getStudyControlLimits, getModelForPlan } = require('../config/creditConfig');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sanitizeJsonString(jsonStr) {
    let result = '';
    let i = 0;
    let inString = false;
    
    while (i < jsonStr.length) {
        const char = jsonStr[i];
        
        if (char === '"') {
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && jsonStr[j] === '\\') {
                backslashCount++;
                j--;
            }
            
            if (backslashCount % 2 !== 0) {
                result += char;
                i++;
                continue;
            }
            
            let left = jsonStr.slice(0, i).trim();
            let right = jsonStr.slice(i + 1).trim();
            
            let isBoundary = false;
            
            if (!inString) {
                if (left.endsWith('{') || left.endsWith(',') || left.endsWith(':') || left.endsWith('[')) {
                    isBoundary = true;
                }
            } else {
                if (right.startsWith('}')) {
                    if (/^\}\s*(,|\}|\]|$)/.test(right)) {
                        isBoundary = true;
                    }
                } else if (right.startsWith(']')) {
                    if (/^\]\s*(,|\}|\]|$)/.test(right)) {
                        isBoundary = true;
                    }
                } else if (right.startsWith(':')) {
                    isBoundary = true;
                } else if (right.startsWith(',')) {
                    let afterComma = right.slice(1).trim();
                    if (afterComma.startsWith('}') || afterComma.startsWith(']')) {
                        isBoundary = true;
                    } else if (afterComma.startsWith('"')) {
                        let nextQuoteIdx = afterComma.indexOf('"', 1);
                        if (nextQuoteIdx !== -1) {
                            let afterNextQuote = afterComma.slice(nextQuoteIdx + 1).trim();
                            if (afterNextQuote.startsWith(':') || afterNextQuote.startsWith(',') || afterNextQuote.startsWith(']') || afterNextQuote.startsWith('}')) {
                                isBoundary = true;
                            }
                        }
                    }
                }
            }
            
            if (isBoundary) {
                result += char;
                inString = !inString;
                i++;
            } else {
                result += '\\"';
                i++;
            }
        } else if (char === '\\' && inString) {
            if (i + 1 < jsonStr.length) {
                const nextChar = jsonStr[i + 1];
                if (nextChar === '"' || nextChar === '\\' || nextChar === '/') {
                    result += '\\' + nextChar;
                    i += 2;
                } else if (nextChar === 'n') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(node|newline|neq|nabla|neg|new)\b/.test(remaining)) {
                        result += '\\\\n';
                        i += 2;
                    } else {
                        result += '\\n';
                        i += 2;
                    }
                } else if (nextChar === 't') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(times|theta|tan|text|tilde|tau|triangle|top|tfrac|to|therefore|tiny|tr|transpose)\b/.test(remaining)) {
                        result += '\\\\t';
                        i += 2;
                    } else {
                        result += '\\t';
                        i += 2;
                    }
                } else if (nextChar === 'b') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(beta|begin|bar|mathbf|box|binom|bullet|bmod|bigcap|bigcup|biguplus|bigotimes|bigoplus|bigodot|backslash)\b/.test(remaining)) {
                        result += '\\\\b';
                        i += 2;
                    } else {
                        result += '\\b';
                        i += 2;
                    }
                } else if (nextChar === 'f') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(frac|forall|flat|frown|footnotesize)\b/.test(remaining)) {
                        result += '\\\\f';
                        i += 2;
                    } else {
                        result += '\\f';
                        i += 2;
                    }
                } else if (nextChar === 'r') {
                    const remaining = jsonStr.slice(i + 1);
                    if (/^(right|rho|rangle|real|rightarrow|rbrace|rfloor|rceil|rvert|rVert)\b/.test(remaining)) {
                        result += '\\\\r';
                        i += 2;
                    } else {
                        result += '\\r';
                        i += 2;
                    }
                } else if (nextChar === 'u') {
                    const remaining = jsonStr.slice(i + 2, i + 6);
                    if (/^[0-9a-fA-F]{4}$/.test(remaining)) {
                        result += '\\u' + remaining;
                        i += 6;
                    } else {
                        result += '\\\\u';
                        i += 2;
                    }
                } else {
                    result += '\\\\';
                    i++;
                }
            } else {
                result += '\\\\';
                i++;
            }
        } else {
            result += char;
            i++;
        }
    }
    return result;
}

function extractJson(text) {
    if (!text) return '';
    
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let startIdx = -1;
    let openChar = '';
    let closeChar = '';
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        openChar = '{';
        closeChar = '}';
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        openChar = '[';
        closeChar = ']';
    }
    
    if (startIdx === -1) {
        const fallback = text.replace(/^```json/mi, '').replace(/```$/mi, '').trim();
        return sanitizeJsonString(fallback);
    }
    
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = startIdx; i < text.length; i++) {
        const char = text[i];
        
        if (escaped) {
            escaped = false;
            continue;
        }
        
        if (char === '\\') {
            escaped = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
            continue;
        }
        
        if (!inString) {
            if (char === openChar) {
                braceCount++;
            } else if (char === closeChar) {
                braceCount--;
                if (braceCount === 0) {
                    const jsonCandidate = text.substring(startIdx, i + 1);
                    return sanitizeJsonString(jsonCandidate);
                }
            }
        }
    }
    
    const lastBrace = text.lastIndexOf(closeChar);
    if (lastBrace !== -1 && lastBrace >= startIdx) {
        return sanitizeJsonString(text.substring(startIdx, lastBrace + 1));
    }
    
    return '';
}

function sanitizeStudyConfig(requestedConfig = {}, userPlan = 'free') {
    const limits = getStudyControlLimits(userPlan);

    const explanationLength = limits.explanationLengths.includes(requestedConfig.explanationLength)
        ? requestedConfig.explanationLength
        : (limits.explanationLengths.includes('standard') ? 'standard' : limits.explanationLengths[0]);

    const mcqEnabled = requestedConfig.mcqEnabled !== false;
    const writtenEnabled = false;
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
        writtenCount: 0,
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

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    return JSON.parse(extractJson(rawText));
}

const blockIdFrom = (index) => `block-${String(index + 1).padStart(2, '0')}`;

function normalizeGeneratedBlocks(blocks = []) {
    const allowedTypes = ['intro', 'concept', 'diagram', 'example', 'code', 'callout', 'summary', 'project', 'practice'];
    return (Array.isArray(blocks) ? blocks : [])
        .map((block, index) => {
            const normalized = {
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
            };

            if (block.inlineChallenge) {
                normalized.inlineChallenge = {
                    type: block.inlineChallenge.type || 'fill-in-the-blank',
                    question: block.inlineChallenge.question || '',
                    codeTemplate: block.inlineChallenge.codeTemplate || '',
                    expectedAnswer: block.inlineChallenge.expectedAnswer || '',
                    hint: block.inlineChallenge.hint || '',
                    options: Array.isArray(block.inlineChallenge.options) ? block.inlineChallenge.options : [],
                    explanation: block.inlineChallenge.explanation || ''
                };
            } else {
                normalized.inlineChallenge = null;
            }

            return normalized;
        })
        .filter((block) => block.title || block.body || block.code || block.callout || block.inlineChallenge);
}

async function generateGuidedSubtopicContent({ courseTitle, topic, moduleTitle, subtopicTitle, subtopicType, config, userPlan = 'free' }) {
    console.log('--- DEBUG: Generating Lesson ---');
    console.log('Topic:', topic);
    console.log('User Plan:', userPlan);
    console.log('Interactive Widgets Enabled:', config.interactiveWidgets);
    
    const isProject = subtopicType === 'mini-project';

    const lengthPref = config.explanationLength || 'standard';
    let blockCountRange = '5-6';
    let depthInstructions = '';

    if (lengthPref === 'short') {
        blockCountRange = '4-5';
        depthInstructions = `1. Explain concepts clearly and descriptively across exactly 4-5 distinct blocks. Even in short mode, avoid brief single-sentence definitions. Write well-explained, descriptive paragraphs that introduce the fundamentals thoroughly.
2. Be focused and clear, but make sure the explanation is comprehensive enough for a beginner to grasp the context.`;
    } else if (lengthPref === 'deep') {
        blockCountRange = '12-15';
        depthInstructions = `1. Explain everything with extreme, comprehensive, and exhaustive depth. Break down all concepts across 12-15 distinct, highly descriptive blocks (covering concepts, examples, callouts, diagrams, and practice) to leave absolutely no stone unturned.
2. Detail all underlying background, history, technical trade-offs, architecture, under-the-hood mechanics, core theories, implementation steps, and potential edge cases.
3. Every "concept", "example", or "practice" block must contain rich, detailed, multi-paragraph prose. Do NOT write basic or quick summaries. Elaborate on details, explain the core logic thoroughly, and include step-by-step problem-solving.`;
    } else {
        // Standard explanation (corresponds to high-level detail, previous 'deep' style)
        blockCountRange = '7-9';
        depthInstructions = `1. Explain concepts thoroughly and clearly with a detailed, well-balanced, and comprehensive approach. Structure the content into 7-9 distinct blocks to ensure highly detailed coverage of all subtopic parts.
2. Every "concept" or "example" block must be highly descriptive, thorough, and detailed. Explain the underlying background, real-world context, and complete details step-by-step. Do not settle for simple, brief definitions.`;
    }

    // Adaptive Code Block Instructions: Instruct the LLM to dynamically determine if the topic/subtopic is programming/coding related
    const codeBlockInstructions = `
- DYNAMIC CODE BLOCKS INSTRUCTION:
  You must dynamically evaluate if the current topic ("${topic}") or subtopic ("${subtopicTitle}") involves computer programming, coding, databases/queries (e.g. SQL, DBMS), scripting, terminal/command-line commands, markup languages (e.g. HTML, CSS), or technical syntax.
  - If it is related to coding/programming/queries/syntax: you SHOULD include standard illustrative code blocks (block type "code") for syntax demonstrations, query examples (like ALTER, SELECT, UPDATE, etc.), config files, or starter code where appropriate. You must decide where code examples are needed to make the concepts practical and clear for the student. Specify the correct "language" field (e.g. sql, javascript, python, cpp, html, css, bash, json).
  - If it is a purely conceptual/non-programming topic: keep explanations conceptual using text, bullet points, comparisons, tables, and concept diagrams, and do not use block type "code" unless showing configuration or data formats.
`;

    // Adaptive Challenges Instructions & Schema
    let challengeInstructions = '';
    let challengeSchema = '';
    
    const hasMcq = !!config.mcqEnabled;
    const hasCodeChallenge = !!config.codeEnabled;
    
    if (hasMcq || hasCodeChallenge) {
        let typesDesc = [];
        let schemaFields = [];
        
        if (hasMcq) {
            typesDesc.push(`- "mcq": A beautiful conceptual multiple-choice question based on the content of this specific block.
    - expectedAnswer: the exact correct option text (must match one of the options exactly).
    - options: an array of exactly 4 choices.
    - explanation: a detailed explanation of why the correct option is right.
    - question: the question text.`);
            schemaFields.push(`"mcq"`);
        }
        
        if (hasCodeChallenge) {
            typesDesc.push(`- "fill-in-the-blank": You provide a text template, formula, or code with exactly ONE missing piece represented by "___". The user must type the exact missing string.
    - codeTemplate: e.g. "def greet(name):\\n    print('Hello, ' + ___)"
    - expectedAnswer: e.g. "name"
- "guess-output": You provide working code or a step-by-step logic statement. The user must type exactly what it outputs or evaluates to.
    - codeTemplate: e.g. "x = 5\\nprint(x * 2)"
    - expectedAnswer: "10"`);
            schemaFields.push(`"fill-in-the-blank" | "guess-output"`);
        }
        
        challengeInstructions = `
INLINE CHALLENGES:
You MUST dynamically decide how many separate blocks should contain an inline challenge based on the complexity and educational value of the content. You can choose to embed challenges in 1, 2, or 3 separate blocks of the lesson, but do not exceed 3 blocks. Keep it highly variable and natural—some lessons might have 1, others 2, and others 3 challenges distributed across separate blocks to test the student at different points of their learning!
Enabled challenge types for this lesson:
${typesDesc.join('\n')}

Rules for inlineChallenge:
- expectedAnswer must be a short, deterministic string (no spaces padding).
- Do not use for every block. Choose a dynamic and variable number of blocks (from 1 up to 3 blocks) to embed challenges where active recall makes sense.
`;

        challengeSchema = `
        "inlineChallenge": {
          "type": ${schemaFields.join(' | ')},
          "question": "string (question or instructions)",
          "codeTemplate": "string (with '___' for fill-in-the-blank, or full template for guess-output)",
          "expectedAnswer": "string (exact correct option text or exact string match)",
          "hint": "string",
          ${hasMcq ? `"options": ["string"],\n          "explanation": "string"` : ''}
        }`;
    }

    const prompt = `
You are creating a comprehensive, highly visual, notes-first guided lesson for the study plan "${courseTitle}" on the overall topic "${topic}".

Current module: "${moduleTitle}"
Current subtopic: "${subtopicTitle}"
Subtopic type: "${subtopicType}"
Student level: ${config.level}${isProject ? `
Requirements for Mini-Project Blueprint:
1. Since this is a mini-project, DO NOT generate standard academic notes. Instead, generate an extremely comprehensive, highly detailed "Project Blueprint" for the student to build locally.
2. Every section must be written with maximum depth, leaving no details vague.
3. Break the blueprint into clear blocks:
   - "intro": Project overview, real-world use case, target audience, system capabilities, and exactly what they will build. Explain the project's real-world relevance deeply.
   - "concept": Core requirements, technical constraints, design patterns, and prerequisites (software, packages, database setup). Detail these thoroughly.
   - "diagram": A visual architecture, component interaction, or data flow diagram using Mermaid.
   - "code": Essential starter code, full file scaffolding, package.json files, environment configurations, or boilerplates needed to begin. Do not write dummy comments; provide actual working scaffold structures.
   - "project": An extremely detailed, step-by-step implementation guide (use bolded numbered lists). Break down the coding phases step-by-step with code/logic explanations for every task.
   - "summary": How to verify/test the project, sample outputs/responses, debugging tips, and the expected final outcome.
4. The goal is to give the student a complete, exhaustive roadmap to successfully build this on their own, acting as an extremely structured, professional developer guide.
` : `
Requirements for Depth and Completeness (Scale: ${lengthPref.toUpperCase()}):
${depthInstructions}
4. Teach like a patient big brother explaining to a beginner: start from basics, use simple words, then slowly introduce jargon. Provide "why this matters" context.
5. EVERY BLOCK MUST BE HIGHLY DESCRIPTIVE AND DETAILED: Do not write brief, single-paragraph, or basic two-sentence explanations. Every concept block must have detailed, comprehensive paragraphs (2-3 detailed paragraphs) explaining the mechanics, logic, under-the-hood principles, and why things work the way they do. Keep all descriptions rich and deeply explanatory.

INTEGRATE SOLVED PROBLEMS & APPLICATION QUESTIONS (CRITICAL):
1. Wherever a topic features formulas, equations, mathematical rules, logic (e.g. logic programming like PSLP, Horn clauses, resolution, unification), algorithms, or technical rules:
   - DO NOT just stick to dry theory and definitions.
   - You MUST explicitly include mathematical, logical, or theoretical questions with complete, step-by-step solved solutions inside one or more blocks (type: "example" or type: "practice").
   - For every question, include:
     - Clear Question/Problem Statement (e.g., "Problem: Calculate the result of...").
     - The underlying formula, theorem, or logic rule being applied.
     - Step-by-step execution: plugging in values, derivation steps, logical reasoning, and final calculation, so the student learns by seeing exactly how the problem is solved.
2. For purely theoretical subtopics, construct hypothetical "what-if" conceptual or scenario-based questions (e.g. "What happens if variable X is changed to Y?") and explain the step-by-step analytical solution/deduction.
3. Show all math formulas and equations clearly using standard text/markdown syntax so they are beautifully formatted and readable.
`}Requirements for Visual & Rich Formatting (CRITICAL):
1. USE MERMAID DIAGRAMS DYNAMICALLY (DO NOT FORCE THEM EVERYWHERE):
   - You should decide whether a subtopic needs visual diagrams based on the nature of the topic.
   - If the subtopic explains processes, workflows, structural hierarchies, classification trees, decision logic, or architectural systems, you SHOULD generate 1 or 2 visual Mermaid diagrams (using block type "diagram").
   - If the topic is purely factual, descriptive, narrative, or simple and doesn't benefit from a diagram (e.g., historical dates, simple definitions), DO NOT force a diagram. Keep a natural, high-quality balance—never force diagrams where they don't make sense, but eagerly use 1 or 2 where they provide strong visual learning value.
   - For every diagram generated, include it inside the block's "body" field.
   - You MUST wrap the Mermaid code inside a standard markdown code block starting with \`\`\`mermaid and ending with \`\`\`.
   - For every diagram block, the "body" MUST include a short plain-English explanation around the diagram:
     1. Before the diagram, briefly explain each important element/node that appears in it.
     2. After the diagram, explain what the whole diagram is trying to show and how the student should read it.
     3. Do not leave the diagram standing alone; the text must make it easy to understand without guessing.
   - Types: Stick strictly to flowcharts (graph TD or graph LR) and sequenceDiagram
   - CRITICAL: In flowcharts, ALWAYS explicitly define every single node with its ID, shape, and rich label in single quotes before/when using them in relationships. Naked node IDs (e.g. referencing 'A' alone without 'A['Label']') are completely banned, as they crash or display ugly uppercase IDs.
   - CRITICAL: In flowcharts, ALWAYS wrap node labels in single quotes. Example: 'A['You (The User)']' instead of 'A["You (The User)"]'.
   - CRITICAL: In sequenceDiagrams, ALWAYS wrap participant names in single quotes if they contain hyphens, dots, or spaces. Example: 'create-next-app' instead of "create-next-app".
   - CRITICAL: NEVER put spaces inside the shape brackets. Use 'A['Text']' NOT 'A[ 'Text' ]', use 'B{'Text'}' NOT 'B{ 'Text' }'.
   - Diagrams must be syntactically valid.
    
   MANDATORY RULES FOR HIGH-QUALITY DYNAMIC CONCEPT DIAGRAMS:
   We support diverse shapes! Eagerly use appropriate, topic-specific visual shapes to make the diagram intuitive:
   * Standard Squircle: 'A['Simple Concept or Phase']'
   * Stadium (Capsule): 'B(['State, Boundary, or Parameter'])'
   * Double-Circle / Circle: 'C(('Root Element, Central Hub, or Key Variable'))' (Highly recommended for trees, heaps, or main concepts!)
   * Database cylinder: 'D[('Data Store, File, Source, or Disk Server')]'
   * Hexagon: 'E{{'External API, System Milestone, or Boundary Event'}}'
   * Subroutine box: 'F[['Modular Subroutine or Complex Function Block']]'
   * Diamond: 'G{'Decision Check, Conditional Split, or Question'}' (Highly recommended for conditionals!)

   First, decide the exact teaching question the diagram answers, such as "How does Bayes theorem transform prior belief into posterior probability?" or "How does data move through a request pipeline?" The graph must make that answer obvious without needing the surrounding paragraph.
   Prefer diagrams that reveal structure, not vocabulary lists. Use the best pattern for the topic:
   - Process: input -> transformation -> output -> feedback.
   - Cause/effect: condition -> mechanism -> consequence.
   - Classification: parent concept -> types -> distinguishing properties.
   - Formula reasoning: known values -> formula step -> substitution -> result interpretation.
   - System architecture: actor -> boundary -> component -> data/state change.
   Add one concrete example node when it improves understanding, and make the final node a clear takeaway/result instead of another vague concept.
   
   PERFECT EXAMPLE MERMAID DIAGRAM (Copy this syntax style perfectly):
   [Mermaid Flowchart Example]
   graph TD
     START(['Start Study Process: Switch toggles at t=0']) -- 'begins' --> SUB[['Initialize: Calculate T-Minus State']]
     SUB -- 'reads from' --> DB[('Database Store: Load Initial Values')]
     DB -- 'triggers check' --> CHECK{'Is Circuit Source-Free?'}
     CHECK -- 'Yes (Source-Free)' --> HOM(('Homogeneous Equations: Focus on Natural Response'))
     CHECK -- 'No (With Source)' --> NHOM(('Non-Homogeneous: Focus on Forced Response'))
     HOM -- 'combines into' --> FOR{{'Formulate Equations: Apply KVL/KCL'}}
     NHOM -- 'combines into' --> FOR
     FOR -- 'final result' --> FIN(['Solve for other variables like dv/dt or di/dt'])
   
   a) NEVER use single-letter or abstract placeholder node IDs as labels (e.g., A, B, C). Every single node in the diagram MUST have a descriptive, rich, human-readable label that explains the concept it represents.
    b) NEVER use the node ID itself, or a short acronym/abbreviation (e.g. 'ODE', 'LAP', 'SOLVE', 'INV', 'HTML', 'CSS') as the entire label text. Doing this renders an empty-looking graph with raw abbreviations. Every node label MUST contain a descriptive explanation (3-12 words) teaching the concept.
       - BAD:  'ODE[['ODE']]' or 'ODE[['Ordinary Differential Equation']]' (too short/vague)
       - GOOD: 'ODE[['ODE: Formulate Ordinary Differential Equation for the circuit']]'
       - BAD:  'LAP[['LAP']]' or 'LAP[['Laplace']]'
       - GOOD: 'LAP[['LAP: Apply Laplace Transform to s-domain']]'
       - BAD:  'SOLVE[['SOLVE']]'
       - GOOD: 'SOLVE[['SOLVE: Solve algebraic equations in s-domain']]'
       - BAD:  'INV[['INV']]'
       - GOOD: 'INV[['INV: Take Inverse Laplace Transform back to time-domain']]'
    c) Node labels MUST be pedagogically meaningful: include brief definitions, formulas, or key properties inside the label text itself (max ~12 words per node). The graph should teach the student at a glance.
       - Example: 'NORM['Normal Form: Eliminate redundancy']' instead of 'NF['Normal Form']'
    d) Edge labels MUST describe the logical relationship between connected concepts. Use descriptive arrow labels like '-- 'is a type of' -->', '-- 'requires' -->', '-- 'produces' -->', '-- 'if condition' -->'.
       - BAD:  'A --> B'  (no label, no meaning)
       - GOOD: 'INP['User Input'] -- 'validated by' --> VAL['Input Validator']'
    e) Aim for 5-10 nodes per diagram. Avoid trivially simple 2-3 node graphs. Build a meaningful topology that shows how concepts connect, flow, or depend on each other.
    f) Structure the graph to reflect real conceptual relationships: cause-effect chains, decision trees, classification hierarchies, process pipelines, or dependency graphs—whatever best fits the subject matter.
     g) MANDATORY VISUAL SHAPE DIVERSITY (CRITICAL): Every single diagram generated MUST utilize at least 3-4 different geometric shapes from the available shapes list. Do NOT use a single shape (like subroutine or rect) all over the diagram. Map checks/conditions to diamonds, storage to databases, hubs to double-circles, processes to subroutines, start/end to stadiums, and milestones to hexagons. This keeps the diagram visually rich, colorful, and engaging!
     h) MANDATORY NON-LINEAR TOPOLOGY (CRITICAL): Avoid generating basic, flat, linear single-chain graphs (e.g. node1 -> node2 -> node3 -> node4 is strictly prohibited!). True concept maps are rich and interconnected. You MUST design non-linear structures featuring decision checks/branches (using diamond nodes that split into 'Yes' and 'No' paths), parallel processing streams, feedback loops (where validation steps connect back to earlier nodes to fix errors), or central hubs with multiple radiating dependencies. The map should look like a highly detailed, professional visual system architecture!
2. USE COMPARISON TABLES: When explaining multiple related concepts (e.g. INNER vs LEFT JOIN), use Markdown tables.
3. USE STRUCTURED CALLOUTS: Use blockquotes in the "body" for special notes:
   - "> 💡 Key insight: [text]"
   - "> ⚠️ Common mistake: [text]"
   - "> 🔗 Real-world analogy: [text]"
4. USE NUMBERED FLOWS: For step-by-step processes, use bolded numbered lists.
5. CODE EXAMPLES AND BLOCKS POLICY:
${codeBlockInstructions}
6. Output ONLY valid JSON. Do not use markdown blocks like 'json'. Return the raw JSON directly.
${challengeInstructions}
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
        "blockSummary": "string"${challengeSchema ? ',\n' + challengeSchema.trim() : ''}
      }
    ],
    "citations": []
  }
}
`;

    let thinkingLevel = 'minimal';
    if (lengthPref === 'deep') {
        thinkingLevel = 'medium';
    } else if (lengthPref === 'standard') {
        thinkingLevel = 'low';
    }

    const apiConfig = {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
        temperature: 0.7,
        thinkingConfig: {
            thinkingLevel
        }
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
        rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
        const jsonText = extractJson(rawText);
        if (!jsonText) throw new Error('AI returned an empty response');
        
        const parsed = JSON.parse(jsonText);
        parsed.lessonContent = parsed.lessonContent || {};
        parsed.lessonContent.blocks = normalizeGeneratedBlocks(parsed.lessonContent.blocks);
        parsed.lessonContent.notesVersion = 2;
        parsed.lessonContent.generatedForLevel = config.level;
        parsed.lessonContent.pdfTitle = parsed.lessonContent.pdfTitle || `${subtopicTitle} Notes`;

        // Sanitize citations to prevent Mongoose validation failures
        if (parsed.lessonContent.citations && Array.isArray(parsed.lessonContent.citations)) {
            parsed.lessonContent.citations = parsed.lessonContent.citations.map(cit => {
                if (typeof cit === 'string') {
                    return { label: cit, url: '' };
                } else if (cit && typeof cit === 'object') {
                    return {
                        label: cit.label || cit.title || cit.name || '',
                        url: cit.url || cit.link || ''
                    };
                }
                return { label: '', url: '' };
            }).filter(cit => cit.label && cit.label.trim() !== '');
        } else {
            parsed.lessonContent.citations = [];
        }

        return parsed;
    } catch (err) {
        console.error('JSON Parse Error. Raw text:', rawText);
        throw new Error(`Failed to parse lesson content: ${err.message}`);
    }
}

async function generatePracticeSheet({ courseTitle, moduleTitle, subtopicTitle, lessonContext, config, userPlan = 'free', difficulty = 'medium', questionTypes = ['mcqs', 'written'], timeLimit = 15 }) {
    // AI-determined question count based on time and difficulty
    const countMap = {
        easy:   { 10: 6,  15: 8,  30: 12, 0: 15 },
        medium: { 10: 7,  15: 10, 30: 15, 0: 20 },
        hard:   { 10: 8,  15: 12, 30: 18, 0: 25 },
    };
    const timeBucket = [10, 15, 30].includes(timeLimit) ? timeLimit : 0;
    const totalCount = (countMap[difficulty] || countMap.medium)[timeBucket];

    const includesMcq = questionTypes.includes('mcqs');
    const includesWritten = questionTypes.includes('written');
    const includesCode = questionTypes.includes('code') && (userPlan !== 'free');
    const includesMath = questionTypes.includes('math') && (userPlan !== 'free');

    // Distribute question count across enabled types
    let mcqCount = 0, writtenCount = 0, codeCount = 0, mathCount = 0;
    const enabledTypes = [includesMcq, includesWritten, includesCode, includesMath].filter(Boolean).length;
    if (enabledTypes === 0) { mcqCount = totalCount; } // fallback
    else {
        if (includesMcq) mcqCount = Math.ceil(totalCount * 0.5);
        const remaining = totalCount - mcqCount;
        if (includesWritten && includesCode && includesMath) {
            writtenCount = Math.floor(remaining / 3);
            codeCount = Math.floor(remaining / 3);
            mathCount = remaining - writtenCount - codeCount;
        } else if (includesWritten && includesCode) {
            writtenCount = Math.ceil(remaining / 2);
            codeCount = remaining - writtenCount;
        } else if (includesWritten && includesMath) {
            writtenCount = Math.ceil(remaining / 2);
            mathCount = remaining - writtenCount;
        } else if (includesWritten) {
            writtenCount = remaining;
        } else if (includesCode) {
            codeCount = remaining;
        } else if (includesMath) {
            mathCount = remaining;
        }
    }

    const prompt = `
You are generating a timed practice test for the study plan "${courseTitle}".

Module: "${moduleTitle}"
Subtopic: "${subtopicTitle}"
Difficulty: ${difficulty}
Time limit: ${timeLimit === 0 ? 'unlimited' : timeLimit + ' minutes'}

Study scope. This is an outline only, not full lesson notes:
${lessonContext}

Generate EXACTLY the following question counts (do not deviate):
- MCQ questions: ${mcqCount}
- Written/essay questions: ${writtenCount}
- Code questions: ${codeCount}
- Math/calculation questions: ${mathCount}

Difficulty calibration:
- easy: test basic recall and definitions
- medium: test understanding and application
- hard: test analysis, multi-step reasoning, and synthesis

Rules:
1. All questions must be strictly based on the course topic, module, current test topic, and topic names above.
2. Do not assume private note details that are not visible in the outline.
3. Written questions need image_upload: true since student may upload handwritten answer.
4. Math questions need image_upload: true since student may upload handwritten calculations.
5. MCQ must have exactly 4 options and one correct answer.
6. Output ONLY valid JSON, no markdown blocks.

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
      "rubric": ["string"],
      "image_upload": true
    }
  ],
  "code": [
    {
      "prompt": "string",
      "language": "string",
      "starterCode": "string",
      "rubric": ["string"],
      "image_upload": false
    }
  ],
  "math": [
    {
      "question": "string",
      "rubric": ["string"],
      "image_upload": true
    }
  ]
}
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan('free'),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    return JSON.parse(extractJson(rawText));
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

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    const parsed = JSON.parse(extractJson(rawText));
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

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    return JSON.parse(extractJson(rawText));
}

async function generateSyllabusDiff({ courseTitle, currentModules, instruction, userPlan = 'free' }) {
    const syllabusText = currentModules.map((m, mi) =>
        `Module ${mi + 1}: ${m.module_title}\n` +
        (m.subtopics || []).map((s, si) =>
            `  Topic ${si + 1} [moduleIndex=${mi}, subtopicIndex=${si}] ${s.subtopic_title} (${s.subtopic_type})`
        ).join('\n')
    ).join('\n\n');

    const prompt = `
You are an intelligent syllabus editor for the study plan "${courseTitle}".

Current syllabus (indices are 0-based):
${syllabusText}

User instruction: "${instruction}"

Your job is to reconstruct the modules and subtopics according to the user's instruction.
This is a highly flexible editor. You can:
1. Add, delete, shift, or rename entire modules.
2. Add new subtopics (lessons or mini-projects) at any position inside any module.
3. Delete existing subtopics by simply omitting them from your reconstructed modules.
4. Reorder subtopics, or move them between different modules!

To preserve existing notes, completed practices, and progress for unchanged subtopics, you MUST reference them using their original module and subtopic indices.

Your JSON output must be a single object containing:
- "summary": A short sentence describing what you changed.
- "modules": An array of reconstructed modules in their final order. Each module must contain:
  - "module_title": The final title of the module.
  - "subtopics": An array of subtopics in their final order. Each subtopic must be EITHER:
    1. An existing subtopic referenced by its original coordinates:
       { "type": "existing", "moduleIndex": number, "subtopicIndex": number }
    2. A brand-new subtopic:
       { "type": "new", "subtopic_title": "string", "subtopic_type": "lesson" | "mini-project" }

Keep all untouched modules and subtopics in their original states. Only perform modifications explicitly requested by the user.

Output strictly valid JSON matching this structure:
{
  "summary": "Divided Module 1 into HTML Basics and CSS Basics, and added a mini-project.",
  "modules": [
    {
      "module_title": "HTML Basics",
      "subtopics": [
        { "type": "existing", "moduleIndex": 0, "subtopicIndex": 0 },
        { "type": "existing", "moduleIndex": 0, "subtopicIndex": 1 }
      ]
    },
    {
      "module_title": "CSS Basics",
      "subtopics": [
        { "type": "existing", "moduleIndex": 0, "subtopicIndex": 2 },
        { "type": "new", "subtopic_title": "Build a Landing Page", "subtopic_type": "mini-project" }
      ]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan(userPlan),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    return JSON.parse(extractJson(rawText));
}

async function generatePerQuestionExplanations({ questions, studentAnswers, gradingResults, topic, subtopicTitle, userPlan = 'free' }) {
    const questionSummaries = questions.map((q, i) => {
        const answer = studentAnswers[i];
        const result = gradingResults[i];
        return `Q${i + 1} [${q.type}]: ${q.question}\nStudent answer: ${answer?.value || answer?.text || '(not answered)'}\nCorrect: ${result?.correct ? 'yes' : 'no'}\nCorrect answer: ${q.correctAnswer || '(subjective — see rubric)'}\nRubric: ${(q.rubric || []).join(', ')}`;
    }).join('\n\n');

    const prompt = `
You are a friendly, expert tutor reviewing a student's practice test.

Topic: "${topic}"
Subtopic: "${subtopicTitle}"

Here are all the questions, the student's answers, and whether they got it right:
${questionSummaries}

For EACH question, write:
1. A short explanation of the correct answer (2-4 sentences)
2. What the student did well (if anything)
3. One concrete tip to improve

Be encouraging but honest. Use simple language.

Output ONLY valid JSON — an array with one entry per question:
[
  {
    "questionIndex": 0,
    "correct": true,
    "explanation": "string (the correct answer explanation)",
    "whatWentWell": "string",
    "improvementTip": "string"
  }
]
`;

    const response = await ai.models.generateContent({
        model: getModelForPlan('free'),
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
    try {
        return JSON.parse(extractJson(rawText));
    } catch {
        return [];
    }
}

async function evaluateImageAnswer({ base64Image, questionText, rubric = [], userPlan = 'free' }) {
    try {
        const prompt = `
You are evaluating a student's handwritten answer image for a practice test question.

Question: ${questionText}
Rubric points to check: ${rubric.join(', ') || 'general correctness and understanding'}

Look at the uploaded image and:
1. First decide whether the image contains a readable student answer to THIS question.
2. Extract/transcribe the handwritten text you can see only if it is a real answer attempt.
3. Evaluate how well it answers the question based on the rubric.
4. Give a score from 0-100.

Strict rejection rule:
- If the image is scenery, a mountain/nature photo, a selfie, an unrelated screenshot, blank paper, too blurry, illegible, or does not contain a relevant written answer, set isReadable to false and score to 0.
- Do not give partial credit for an image that has no readable answer text.

Output ONLY valid JSON:
{
  "isReadable": true,
  "extractedText": "string (what you could read from the image)",
  "score": 75,
  "feedback": "string (brief evaluation)",
  "evaluationNote": "string (any notes about image quality or readability)"
}
`;

        const response = await ai.models.generateContent({
            model: getModelForPlan('free'),
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Image
                            }
                        }
                    ]
                }
            ]
        });

        const rawText = typeof response.text === 'function' ? await response.text() : (response.text || '');
        return JSON.parse(extractJson(rawText));
    } catch (err) {
        console.error('evaluateImageAnswer error:', err.message);
        return {
            isReadable: false,
            extractedText: '',
            score: 0,
            feedback: 'Could not evaluate image.',
            evaluationNote: 'Image evaluation failed: ' + err.message
        };
    }
}

module.exports = {
    sanitizeStudyConfig,
    generateGuidedScaffold,
    generateGuidedSubtopicContent,
    generatePracticeSheet,
    rewriteGuidedLessonBlock,
    gradeGuidedSubmission,
    generateSyllabusDiff,
    generatePerQuestionExplanations,
    evaluateImageAnswer
};
