const ticket = require('../services/ticket.service.js');
const llm = require('../services/llm.service.js');

const generateTicket = (req, res) => {
    const body = req.body;

    if (body && body.prompt) {
        const ticketID = ticket.getRandomUUID();
        ticket.setTicket(ticketID, body.prompt);

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

    const responseStream = await llm.generateLLMResponse(ticket.getTicket(ticketID));

    for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify(chunk.text)}\n\n`);
    }

    res.write(`data: ${JSON.stringify("stream closed\n Session ended")}\n\n`);
    
    ticket.deleteTicket(ticketID);
    res.end();

    req.on('close', () => {
        ticket.deleteTicket(ticketID);
        res.end();
    });
}

module.exports = {
    generateTicket,
    getLLMResponse
};
