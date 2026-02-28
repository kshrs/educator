const crypto = require('crypto');

const ticketStore = new Map();

const getRandomUUID = () => {
    return crypto.randomUUID();
};

const getTicket = (ticketID) => {
    return ticketStore.get(ticketID);
};

const setTicket = (ticketID, value) => {
    return ticketStore.set(ticketID, value);
};

const deleteTicket = (ticketID) => {
    return ticketStore.delete(ticketID);
};

const hasTicket = (ticketID) => {
    return ticketStore.has(ticketID);
};

module.exports = {
    getRandomUUID,
    getTicket,
    setTicket,
    deleteTicket,
    hasTicket
}
