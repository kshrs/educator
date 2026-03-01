const ticket = require('../services/ticket.service.js');
const llm = require('../services/llm.service.js');
const chats = require('../services/chatHistory.service.js');

const generateTicket = async (req, res) => {
    const body = req.body;

    if (body && body.prompt) {
        const ticketID = ticket.getRandomUUID();
        const prompt = typeof body.prompt === 'string' ? body.prompt : body.prompt.text;
        ticket.setTicket(ticketID, prompt);
        await chats.addChatToHistory('user', prompt);

        // Status 200 -> Okay
        res.status(200).json({
            message: "Ticket Generated",
            ticketID: ticketID
        });
        return;
    }

    // Status 400 -> Client Side Error
    res.status(400).json({
        message: "Ticket Not Generated"
    });

};

const getLLMResponse = async (req, res) => {
    const ticketID = req.params.ticketID;
    if (!ticket.hasTicket(ticketID)) {
        res.status(404).json({
            message: "TicketID not found"
        });
        return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const responseStream = await llm.generateLLMResponse(await chats.getChatHistory());
        let markdownResponse = "";
        for await (const chunk of responseStream) {
            res.write(`data: ${JSON.stringify(chunk.text)}\n\n`);
            markdownResponse += chunk.text;
        }
        await chats.addChatToHistory('model', markdownResponse);

    res.write(`data: ${JSON.stringify("stream closed\n Session ended")}\n\n`);
    
    ticket.deleteTicket(ticketID);
    res.end();

    req.on('close', () => {
        ticket.deleteTicket(ticketID);
        res.end();
    });
    } catch (e) {
        if (e.status == 429) {
            res.write(`data: ${JSON.stringify("API Limit Exceeded")}\n\n`)
        }
        console.warn(e);
        return;
    }

};

const getChatHistory = async (_, res) => {
    try {
        const history = await chats.getChatHistory();
        const username = await chats.getUserName();
        res.status(200).json({
            message: "chat history",
            user: username,
            history: history
        });
    } catch (e) {
        console.log(`Error getting chat history: ${e.message}`);
        res.status(400).json({
            message: "Error Getting Chat History",
        });
    }
};

const getUserName = async (_, res) => {
    try {
        const username = await chats.getUserName();
        res.status(200).json({
            username: username
        });
    } catch (e) {
        res.status(400).json({
            message: e.message
        });
    }
};

const deleteChatHistory = async (req, res) => {
    try {
        await chats.clearChatHistory();
        res.status(200).json({
            message: "Chat History Deleted"
        });
    } catch (e) {
        res.status(400).json({
            message: e.message
        });
    }
}

module.exports = {
    generateTicket,
    getLLMResponse,
    getChatHistory,
    getUserName,
    deleteChatHistory
};
