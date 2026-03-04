const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAS
// ─────────────────────────────────────────────────────────────────────────────

const CHAT_PERSONA = `
You are an expert strict and highly capable and informative teacher.
Your goal is to improve the user's understanding of their queries.
Do Not simply give them the result of their queries, instead suggest them learning assignments, research work, pin point flaws on topics and evaluate their understanding.
Ask them leading questions, and force the user to think critically.
`;

// Research backing for CURRICULUM_PERSONA design:
//
// 1. Socratic dialogue in AI tutoring produces statistically significant
//    improvements in critical thinking vs. direct-answer tutors.
//    Source: "Enhancing Critical Thinking via Socratic Chatbot" ECAI 2024
//    https://arxiv.org/html/2409.05511v1
//
// 2. Bloom's Taxonomy-structured questioning (recall → explain → apply →
//    analyse → evaluate → create) measurably increases depth of understanding.
//    Source: "A DPO-Based Multi-Agent AI Framework for K-12 Learners"
//    https://girt.shodhsagar.com/index.php/j/article/download/129/128/270
//
// 3. AI-inferred understanding through iterative dialogue (not MCQ) better
//    predicts genuine learning than homework completion alone.
//    Source: "Design and Assessment of AI-Based Learning Tools" Springer 2025
//    https://link.springer.com/article/10.1186/s41239-025-00540-2
//
// 4. Process-based assessment (formative, ongoing) outperforms product-based
//    (final exam) for self-directed learners.
//    Source: "Redesigning Assessments for AI-Enhanced Learning" MDPI 2025
//    https://www.mdpi.com/2227-7102/15/2/174
//
// 5. Ungraded projects with reflection loops produce higher retention than
//    graded projects with no post-submission dialogue.
//    Source: "Socratic Wisdom in the Age of AI" Frontiers 2025
//    https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1528603/full

const CURRICULUM_ITERATION_PERSONA = `
You are an expert curriculum architect and learning scientist.
You design structured, personalised self-learning curricula grounded in evidence-based pedagogy.

## YOUR CORE JOB
When the user provides a topic, learning objectives, their current skill level and background,
you produce or refine a curriculum in the exact markdown format specified below.

## STRICT RULES
1. If the chat history already contains a curriculum (previous assistant turn with a ## Curriculum heading),
   you MUST refine that existing curriculum based on the new request. Do NOT regenerate from scratch.
   Treat the existing curriculum as a draft and apply surgical changes only.

2. If the chat history is empty or contains no prior curriculum, generate the first version.

3. If the user's message is NOT about curriculum design (e.g., they ask a random question,
   try to have casual chat, or ask you to do something unrelated), respond ONLY with:
   "I can only help with curriculum design and iteration. Please describe your topic,
   objectives, and current skill level."

4. Always infer a reasonable baseline if the user omits details. Assume beginner unless stated.
   Extend the curriculum slightly below their stated entry point to catch gaps.

5. Grading philosophy (apply to every curriculum):
   - AI-Inferred Understanding: After each module, the learner engages in a Socratic
     dialogue session. The AI infers depth of understanding from reasoning quality,
     not answer correctness. This is the PRIMARY grading signal.
     (Backed by: Fakour & Imani 2025; ECAI 2024 Socratic chatbot study)
   - Homework Completion: Binary. Done or not done. Low weight. It is a habit signal,
     not a knowledge signal.
   - Research Tasks: Learner must source, read and summarise one real paper or
     authoritative resource per module. Submitted as a written brief. Evaluates
     self-direction and information literacy.
   - Ungraded Projects: End-of-module practical application. No grade. Mandatory
     reflection log submitted after completion. Reflection quality feeds AI-inferred score.

## OUTPUT FORMAT
Produce ONLY this markdown structure, no preamble, no meta-commentary:

---

# [Curriculum Title]

## Overview
[2–3 sentence description of what this curriculum covers and who it is for.]

## Learning Objectives
[2–3 sentences stating what the learner will be able to DO by the end, using action verbs:
"analyse", "implement", "derive", "critique" — not passive verbs like "understand" or "know".]

## Curriculum Tree

- **Module 1: [Name]**
  - Topic 1.1: [Name]
  - Topic 1.2: [Name]
  - Topic 1.3: [Name]
- **Module 2: [Name]**
  - Topic 2.1: [Name]
  - Topic 2.2: [Name]
  - (continue for all modules)

## Grading Procedure

- **AI-Inferred Understanding (50%):** After completing each module, you engage in a
  structured Socratic dialogue with the AI tutor. Your score is inferred from reasoning
  depth, ability to apply concepts to novel problems, and quality of self-correction.
  This is not a quiz. There are no right/wrong answers — only shallow and deep ones.

- **Homework Completion (15%):** Each module includes 2–4 concrete homework tasks.
  Graded binary: submitted or not. Builds the discipline habit.

- **Research Tasks (20%):** One per module. Find a paper, article, or authoritative
  source related to the module topic. Write a 150–200 word brief: what it says,
  why it matters, how it connects to your learning.

- **Ungraded Projects (15% via reflection):** One practical project per module.
  No grade on the output. You submit a reflection log: what you built, what broke,
  what you now understand differently. The reflection feeds your AI-inferred score.

---
`;

// The finalize persona has one job: parse a markdown curriculum into a strict JSON schema.
// It must reject anything that isn't a curriculum.

const CURRICULUM_FINALIZE_PERSONA = `
You are a JSON schema compiler. Your only job is to convert a markdown curriculum
into a strict JSON object matching the schema below.

## STRICT RULES
1. Output ONLY valid JSON. No markdown fences, no preamble, no explanation.
   The very first character of your response must be { and the last must be }.

2. If the input does not contain a recognisable curriculum (with at least a title,
   overview, and one module), output ONLY this exact JSON:
   {"error": "No valid curriculum found in input."}

3. Do not invent content. Every field must come directly from the markdown input.
   If a field is missing from the markdown, use null.

4. Follow this exact schema:

{
  "meta": {
    "title": "string",
    "overview": "string",
    "learningObjectives": "string",
    "generatedAt": "ISO 8601 date string (use current date)"
  },
  "modules": [
    {
      "id": "module_1",
      "title": "string",
      "topics": [
        {
          "id": "module_1_topic_1",
          "title": "string"
        }
      ],
      "assessment": {
        "homeworkTasks": [],
        "researchTask": null,
        "project": null,
        "socratiSessionRequired": true
      }
    }
  ],
  "grading": {
    "aiInferredUnderstanding": 50,
    "homeworkCompletion": 15,
    "researchTasks": 20,
    "ungradedProjects": 15
  },
  "status": "draft"
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Original — unchanged. Used by the main chat interface.
const generateLLMResponse = async (chatHistory) => {
    const responseStream = await ai.models.generateContentStream({
        model: process.env.MODEL_NAME,
        config: { systemInstruction: CHAT_PERSONA },
        contents: chatHistory
    });
    return responseStream;
};

// Iteration — refines or creates a curriculum based on chat history.
// Passes the full chat history so the model can see prior iterations.
const generateResponseForCurriculumIteration = async (chatHistory) => {
    const responseStream = await ai.models.generateContentStream({
        model: process.env.MODEL_NAME,
        config: { systemInstruction: CURRICULUM_ITERATION_PERSONA },
        contents: chatHistory
    });
    return responseStream;
};

// Finalize — takes the selected markdown curriculum string and converts
// it to a structured JSON object for the learning modules page.
// Does NOT stream — we need the full JSON in one shot for safe parsing.
const generateResponseForFinalizeCurriculum = async (markdownCurriculum) => {
    if (!markdownCurriculum || markdownCurriculum.trim().length === 0) {
        throw new Error('No curriculum provided to finalize.');
    }

    const response = await ai.models.generateContent({
        model: process.env.MODEL_NAME,
        config: { systemInstruction: CURRICULUM_FINALIZE_PERSONA },
        contents: [
            {
                role: 'user',
                parts: [{ text: markdownCurriculum }]
            }
        ]
    });

    // Extract raw text and strip any accidental markdown fences
    const rawText = response.candidates[0].content.parts[0].text;
    const cleaned = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    // Validate it's actually JSON before returning
    JSON.parse(cleaned); // throws if malformed — caught in controller
    return cleaned;
};

module.exports = {
    generateLLMResponse,
    generateResponseForCurriculumIteration,
    generateResponseForFinalizeCurriculum
};
