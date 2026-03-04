const { Curriculum } = require('../models/curriculum.model.js');
const { User } = require('../models/user.model.js');

const DEV_USER = "kshrs";

// --- Internal helper ---
// Resolves the dev user's ObjectId — same pattern as chatHistory.service.js.
// Swap this for req.user._id when auth is added.
const getDevUserId = async () => {
    let user = await User.findOne({ username: DEV_USER });
    if (!user) {
        user = await User.create({ username: DEV_USER, chatHistory: [] });
    }
    return user._id;
};

// --- Create ---
// Called once when the user starts a new curriculum session.
// Returns the new curriculum document.
const createCurriculum = async (topic) => {
    const userId = await getDevUserId();
    const curriculum = await Curriculum.create({
        userId,
        topic,
        conversationHistory: [],
        iterations: [],
        selectedIterationIndex: null,
        finalizedCurriculum: null,
        status: 'iterating'
    });
    return curriculum;
};

// --- Read ---
const getCurriculumById = async (curriculumId) => {
    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum) throw new Error(`Curriculum not found: ${curriculumId}`);
    return curriculum;
};

// Returns all curricula for the dev user — for listing in the UI sidebar.
const getAllCurriculaForUser = async () => {
    const userId = await getDevUserId();
    // Only fetch lightweight fields — never load full history for a list view
    return Curriculum.find({ userId })
        .select('topic status selectedIterationIndex createdAt updatedAt')
        .sort({ updatedAt: -1 });
};

// Returns the conversation history in Gemini format — passed directly to the LLM.
const getConversationHistory = async (curriculumId) => {
    const curriculum = await getCurriculumById(curriculumId);
    return curriculum.conversationHistory;
};

// --- Write history ---
// Appends a message to both conversationHistory (for LLM) and
// creates/updates the paired iteration entry (for UI).
const addUserPrompt = async (curriculumId, prompt) => {
    const curriculum = await getCurriculumById(curriculumId);

    curriculum.conversationHistory.push({
        role: 'user',
        parts: [{ text: prompt }]
    });

    // Push a new iteration entry — response will be filled by addModelResponse
    curriculum.iterations.push({
        iterationNumber: curriculum.iterations.length + 1,
        userPrompt: prompt,
        markdownResponse: '' // placeholder until stream completes
    });

    await curriculum.save();
    return curriculum;
};

const addModelResponse = async (curriculumId, markdownResponse) => {
    const curriculum = await getCurriculumById(curriculumId);

    curriculum.conversationHistory.push({
        role: 'model',
        parts: [{ text: markdownResponse }]
    });

    // Fill in the response for the last iteration entry
    const lastIndex = curriculum.iterations.length - 1;
    curriculum.iterations[lastIndex].markdownResponse = markdownResponse;

    // Mongoose doesn't auto-detect mutations inside arrays of subdocuments
    curriculum.markModified('iterations');

    await curriculum.save();
    return curriculum;
};

// --- Select iteration ---
// The user picks which iteration they want to work with before finalizing.
const selectIteration = async (curriculumId, iterationIndex) => {
    const curriculum = await getCurriculumById(curriculumId);

    if (iterationIndex < 0 || iterationIndex >= curriculum.iterations.length) {
        throw new Error(`Invalid iteration index: ${iterationIndex}`);
    }

    curriculum.selectedIterationIndex = iterationIndex;
    await curriculum.save();
    return curriculum;
};

// Returns the markdown of the currently selected iteration.
// Used by finalizeCurriculum to know what to send to the LLM.
const getSelectedMarkdown = async (curriculumId) => {
    const curriculum = await getCurriculumById(curriculumId);

    if (curriculum.selectedIterationIndex === null) {
        throw new Error('No iteration selected. Select an iteration before finalizing.');
    }

    const iteration = curriculum.iterations[curriculum.selectedIterationIndex];
    if (!iteration) {
        throw new Error('Selected iteration not found.');
    }

    return iteration.markdownResponse;
};

// --- Finalize ---
// Writes the parsed JSON object and marks status as finalized.
const saveFinalizedCurriculum = async (curriculumId, finalizedJSON) => {
    const curriculum = await getCurriculumById(curriculumId);

    if (curriculum.iterations.length === 0) {
        throw new Error('Cannot finalize a curriculum with no iterations.');
    }

    curriculum.finalizedCurriculum = finalizedJSON;
    curriculum.status = 'finalized';

    // Mixed field — must mark modified explicitly or Mongoose won't persist it
    curriculum.markModified('finalizedCurriculum');

    await curriculum.save();
    return curriculum;
};

// --- Delete ---
const deleteCurriculum = async (curriculumId) => {
    const result = await Curriculum.findByIdAndDelete(curriculumId);
    if (!result) throw new Error(`Curriculum not found: ${curriculumId}`);
    return result;
};

module.exports = {
    createCurriculum,
    getCurriculumById,
    getAllCurriculaForUser,
    getConversationHistory,
    addUserPrompt,
    addModelResponse,
    selectIteration,
    getSelectedMarkdown,
    saveFinalizedCurriculum,
    deleteCurriculum
};
