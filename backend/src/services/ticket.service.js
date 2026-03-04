const crypto = require('crypto');

// In-memory store that maps ticketID → request payload.
// Tickets are created on POST, consumed on GET (SSE), then deleted.
// Lives in memory intentionally — tickets are short-lived (seconds) and
// don't need to survive a server restart. A Redis store would replace this
// if the app scales to multiple Node processes.
const ticketStore = new Map();

const getRandomUUID = () => crypto.randomUUID();

const getTicket    = (ticketID) => ticketStore.get(ticketID);
const setTicket    = (ticketID, value) => ticketStore.set(ticketID, value);
const deleteTicket = (ticketID) => ticketStore.delete(ticketID);
const hasTicket    = (ticketID) => ticketStore.has(ticketID);

module.exports = {
    getRandomUUID,
    getTicket,
    setTicket,
    deleteTicket,
    hasTicket
};
