const ticket = require('../services/ticket.service.js');
const llm = require('../services/llm.service.js');
const curriculum = require('../services/curriculum.service.js');

const startCurriculum = async (req, res) => {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ message: 'Topic is required.' });
    try {
        const doc = await curriculum.createCurriculum(topic.trim());
        res.status(201).json({ message: 'Curriculum started.', curriculumId: doc._id, topic: doc.topic });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const iterateCurriculum = async (req, res) => {
    const { prompt, curriculumId } = req.body;
    if (!prompt || !curriculumId) return res.status(400).json({ message: 'prompt and curriculumId are required.' });
    try {
        await curriculum.addUserPrompt(curriculumId, prompt);
        const ticketID = ticket.getRandomUUID();
        ticket.setTicket(ticketID, { prompt, curriculumId }); // store curriculumId ON the ticket
        res.status(200).json({ message: 'Iteration ticket generated.', ticketID });
    } catch (e) { 
        console.error('[curriculum] iterateCurriculum FULL ERROR:', e); // ← add this
        res.status(500).json({ message: e.message }); 
    }
};

const streamCurriculumIteration = async (req, res) => {
    const ticketID = req.params.ticketID;
    if (!ticket.hasTicket(ticketID)) return res.status(404).json({ message: 'TicketID not found.' });
    const { curriculumId } = ticket.getTicket(ticketID);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    req.on('close', () => ticket.deleteTicket(ticketID));

    try {
        const history = await curriculum.getConversationHistory(curriculumId);
        const responseStream = await llm.generateResponseForCurriculumIteration(history);
        let markdownResponse = '';
        for await (const chunk of responseStream) {
            res.write(`data: ${JSON.stringify(chunk.text)}\n\n`);
            markdownResponse += chunk.text;
        }
        await curriculum.addModelResponse(curriculumId, markdownResponse);
        res.write(`data: ${JSON.stringify('stream closed\n Session ended')}\n\n`);
        ticket.deleteTicket(ticketID);
        res.end();
    } catch (e) {
        res.write(`data: ${JSON.stringify(e.status === 429 ? 'API Limit Exceeded' : e.message)}\n\n`);
        console.warn('[curriculum] stream error:', e);
        res.end();
    }
};

const selectIteration = async (req, res) => {
    const { curriculumId, iterationIndex } = req.body;
    if (curriculumId === undefined || iterationIndex === undefined)
        return res.status(400).json({ message: 'curriculumId and iterationIndex are required.' });
    try {
        const doc = await curriculum.selectIteration(curriculumId, iterationIndex);
        res.status(200).json({ message: `Iteration ${iterationIndex + 1} selected.`, selectedIterationIndex: doc.selectedIterationIndex });
    } catch (e) { res.status(400).json({ message: e.message }); }
};

const finalizeCurriculum = async (req, res) => {
    const { curriculumId } = req.body;
    if (!curriculumId) return res.status(400).json({ message: 'curriculumId is required.' });
    try {
        const markdownCurriculum = await curriculum.getSelectedMarkdown(curriculumId); // throws if none selected
        const jsonString = await llm.generateResponseForFinalizeCurriculum(markdownCurriculum);
        const parsed = JSON.parse(jsonString);
        if (parsed.error) return res.status(422).json({ message: parsed.error });
        const doc = await curriculum.saveFinalizedCurriculum(curriculumId, parsed);
        res.status(200).json({ message: 'Curriculum finalized.', curriculumId: doc._id, finalizedCurriculum: doc.finalizedCurriculum });
    } catch (e) {
        if (e instanceof SyntaxError) return res.status(500).json({ message: 'Model returned malformed JSON.' });
        res.status(500).json({ message: e.message });
    }
};

const listCurricula = async (_, res) => {
    try {
        const list = await curriculum.getAllCurriculaForUser();
        res.status(200).json({ curricula: list });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const getCurriculum = async (req, res) => {
    try {
        const doc = await curriculum.getCurriculumById(req.params.curriculumId);
        res.status(200).json(doc);
    } catch (e) { res.status(404).json({ message: e.message }); }
};

const deleteCurriculum = async (req, res) => {
    try {
        await curriculum.deleteCurriculum(req.params.curriculumId);
        res.status(200).json({ message: 'Curriculum deleted.' });
    } catch (e) { res.status(404).json({ message: e.message }); }
};

module.exports = { 
    startCurriculum, 
    iterateCurriculum, 
    streamCurriculumIteration, 
    selectIteration, 
    finalizeCurriculum, 
    listCurricula, 
    getCurriculum, 
    deleteCurriculum 
};
