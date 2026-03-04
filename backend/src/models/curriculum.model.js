const mongoose = require('mongoose');

// Mirrors the Gemini API content format exactly —
// so getCurriculumHistory() can be passed directly to the LLM without transformation.
const curriculumMessageSchema = mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    parts: [{
        text: {
            type: String,
            required: true
        }
    }]
}, { _id: false });

// One iteration = one user prompt + one model markdown response.
// Storing them paired (not as flat history) lets the UI render
// "Iteration 1 / Iteration 2 / ..." tabs without parsing the full history.
const iterationSchema = mongoose.Schema({
    iterationNumber: {
        type: Number,
        required: true
    },
    userPrompt: {
        type: String,
        required: true
    },
    markdownResponse: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// The finalized JSON structure produced by generateResponseForFinalizeCurriculum.
// Stored as Mixed so Mongoose doesn't fight the dynamic module/topic shape —
// the LLM service already validates the structure before this is written.
const finalizedCurriculumSchema = mongoose.Schema({
    meta: {
        title: String,
        overview: String,
        learningObjectives: String,
        generatedAt: String
    },
    modules: { type: mongoose.Schema.Types.Mixed, default: [] },
    grading: {
        aiInferredUnderstanding: Number,
        homeworkCompletion: Number,
        researchTasks: Number,
        ungradedProjects: Number
    },
    status: {
        type: String,
        default: 'draft'
    }
}, { _id: false });

// --- Main Curriculum Schema ---
const curriculumSchema = mongoose.Schema({

    // Owner reference — never embed curricula in User, they're accessed independently
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Short label for listing curricula in the UI without loading full content
    topic: {
        type: String,
        required: true,
        trim: true
    },

    // Full flat history in Gemini format — passed directly to the LLM on each iteration
    // so the model sees the full conversation and refines rather than regenerates
    conversationHistory: [curriculumMessageSchema],

    // Paired iterations for the UI — "Iteration 1", "Iteration 2", etc.
    iterations: [iterationSchema],

    // Index of whichever iteration the user has selected as their working curriculum.
    // null means no selection yet. Used by finalize to know what markdown to submit.
    selectedIterationIndex: {
        type: Number,
        default: null
    },

    // Written once when the user clicks Finalize. Null until then.
    finalizedCurriculum: {
        type: finalizedCurriculumSchema,
        default: null
    },

    // Lifecycle: iterating → finalized
    status: {
        type: String,
        enum: ['iterating', 'finalized'],
        default: 'iterating'
    }

}, { timestamps: true }); // createdAt + updatedAt auto-managed by Mongoose

const Curriculum = mongoose.model('Curriculum', curriculumSchema);

module.exports = { Curriculum };
