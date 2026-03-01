const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller.js');

router.post('/prompt', chatController.generateTicket);
router.get('/events/:ticketID', chatController.getLLMResponse);
router.get('/history', chatController.getChatHistory);
router.get('/username', chatController.getUserName);
router.get('/deleteHistory', chatController.deleteChatHistory);

module.exports = {
    router
};

