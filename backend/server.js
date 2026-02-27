const { GoogleGenAI } = require('@google/genai')
const express = require('express');
const crypto = require('crypto');
const { warn } = require('console');
const app = express();
require('dotenv').config();
// Middle ware for json
app.use(express.json());
const port = process.env.PORT || 3000;

const ticketStore = new Map();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Server Sent Event(SSE)
app.get('/events/:ticketID', async (req, res) => {
    const ticketID = req.params.ticketID;
    if (!ticketStore.has(ticketID)) {
            res.status(404).json({
                message: "TicketID not found"
            });
            return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();


    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: ticketStore.get(ticketID),
    })
    for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify(chunk.text)}\n\n`);
    }
    res.write(`data: ${JSON.stringify("stream closed\n Session ended")}\n\n`);
    ticketStore.delete(ticketID);
    res.end();

    req.on('close', () => {
        ticketStore.delete(ticketID);
        res.end();
    });
})

app.post('/prompt', (req, res) => {
    
    const body = req.body;

    if (body && body.prompt) {
        const uuid = crypto.randomUUID();
        ticketStore.set(uuid, body.prompt);
        res.status(200).json({
            message: 'Ticket Generated',
            ticketID: uuid,
        });
        return;
    }
    res.status(400).json({
        message: 'Ticket not generated',
        data: body,
    });
});

app.get('/', (req, res) => {
    res.send("Hello World\n");
});

app.listen(port, () => {
    console.log(`Server Listening at port ${port}`);
});
