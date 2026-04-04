const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates a checkpoint (assessment) for a given day's content.
 * Automatically detects if content is theory-only or coding-related.
 *
 * @param {string[]} videoTitles - Titles of videos watched today
 * @param {string} courseTitle - Overall course/playlist title
 * @returns {{ questionType, theoryQuestions, codingQuestion }}
 */
async function generateCheckpoint(videoTitles, courseTitle) {
    const prompt = `
You are an expert educator creating a daily learning checkpoint assessment.

The student is learning "${courseTitle}" and today they studied these topics:
${videoTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Your task:
1. First, determine if today's content is THEORY-ONLY or involves CODING:
   - Theory-only examples: "What is HTTP?", "History of JavaScript", "Understanding REST APIs concepts"
   - Coding-related examples: "Build a REST API", "React State Management", "CSS Grid Layout", 
     "Node.js File System", "MongoDB CRUD Operations", "Python Functions"
   - If ANY video involves hands-on coding/implementation → mark as "mixed"
   - If ALL videos are purely conceptual/theoretical → mark as "theory"

2. Generate 3-5 DESCRIPTIVE theory questions that require long-form answers.
   - Questions should test DEEP understanding, not just recall
   - Questions should be answerable based on what the videos likely taught
   - Questions should require 100-300 word answers

3. If the content is coding-related, also generate 1 PRACTICAL coding challenge:
   - A mini-project or implementation task based on today's topics
   - Specify the programming language(s) expected
   - Describe the expected behavior clearly
   - The task should be completable in 15-30 minutes
   - It should be a REAL practical exercise, not just "write a function that adds two numbers"

Output ONLY valid JSON:
{
  "questionType": "theory" | "mixed",
  "theoryQuestions": [
    { "question": "Explain in detail how..." },
    { "question": "Compare and contrast..." },
    { "question": "Describe the process of..." }
  ],
  "codingQuestion": {
    "prompt": "Build a simple Express.js REST API that handles CRUD operations for a 'tasks' resource. The API should support GET /tasks, POST /tasks, PUT /tasks/:id, and DELETE /tasks/:id. Use an in-memory array as the data store.",
    "language": "JavaScript (Node.js)",
    "expectedBehavior": "The API should: 1) Return all tasks on GET, 2) Create a new task with title and status on POST, 3) Update a task by ID on PUT, 4) Delete a task by ID on DELETE. Each task should have an id, title, status, and createdAt field."
  }
}

NOTE: If questionType is "theory", set codingQuestion to { "prompt": "", "language": "", "expectedBehavior": "" }
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);
        console.log(`📝 Checkpoint generated: ${result.questionType} (${result.theoryQuestions?.length || 0} theory Q's)`);
        return result;
    } catch (error) {
        console.error('❌ Checkpoint generation failed:', error.message);
        throw new Error('Failed to generate checkpoint: ' + error.message);
    }
}

/**
 * Grades a student's checkpoint submission using Gemini 2.5 Flash.
 *
 * @param {string} courseTitle
 * @param {string[]} videoTitles - What the student learned today
 * @param {string} questionType - 'theory' or 'mixed'
 * @param {{ question: string }[]} theoryQuestions
 * @param {string[]} theoryAnswers
 * @param {{ prompt, language, expectedBehavior }} codingQuestion
 * @param {{ fileName, content }[]} codeFiles
 * @returns {{ theoryScores, codingScore, overallScore, passed, overallFeedback }}
 */
async function gradeCheckpoint({ courseTitle, videoTitles, questionType, theoryQuestions, theoryAnswers, codingQuestion, codeFiles }) {

    let codingSection = '';
    if (questionType === 'mixed' && codingQuestion?.prompt) {
        codingSection = `
SECTION B — CODING (40% of total grade)
Evaluate the code for: correctness, code quality, proper structure, whether it actually solves the stated problem.
Score 0-100.

Coding Prompt Given: ${codingQuestion.prompt}
Expected Language: ${codingQuestion.language}
Expected Behavior: ${codingQuestion.expectedBehavior}

Student's Submitted Files:
${(codeFiles || []).map(f => `--- ${f.fileName} ---\n${f.content}`).join('\n\n')}

${(!codeFiles || codeFiles.length === 0) ? 'NOTE: Student did not submit any code files. Score this section 0.' : ''}
`;
    }

    const theoryWeight = questionType === 'mixed' ? '60% of total grade' : '100% of total grade';

    const prompt = `
You are a strict but fair university professor grading a student's daily learning checkpoint.

Today's learning covered these topics (from the videos they watched):
${videoTitles.join(', ')}

Course subject: ${courseTitle}

SECTION A — THEORY (${theoryWeight})
Grade each answer on: accuracy, depth of understanding, use of correct terminology, completeness.
Score each question 0-100. Be fair but rigorous.

${theoryQuestions.map((q, i) => `
Q${i + 1}: ${q.question}
Student's Answer: ${theoryAnswers[i] || '[no answer provided]'}
`).join('\n')}

${codingSection}

GRADING RULES:
- Empty or very short answers (< 20 words for theory) should score 0-15
- Partially correct answers: 30-60
- Good answers with minor gaps: 60-80
- Excellent, comprehensive answers: 80-100
- The overall passing threshold is 60%
- Calculate overallScore as the weighted average of all sections

Output ONLY valid JSON:
{
  "theoryScores": [
    { "questionIndex": 0, "score": 85, "feedback": "Good explanation but you missed the point about..." },
    { "questionIndex": 1, "score": 60, "feedback": "Partially correct. You should have also mentioned..." }
  ],
  ${questionType === 'mixed' ? '"codingScore": { "score": 78, "feedback": "Code works correctly but lacks error handling. The structure is clean..." },' : '"codingScore": null,'}
  "overallScore": 72,
  "passed": true,
  "overallFeedback": "Strong understanding of the core concepts. Areas to improve: ..."
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);
        console.log(`📊 Checkpoint graded: ${result.overallScore}/100 — ${result.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
        return result;
    } catch (error) {
        console.error('❌ Checkpoint grading failed:', error.message);
        throw new Error('Failed to grade checkpoint: ' + error.message);
    }
}

module.exports = { generateCheckpoint, gradeCheckpoint };
