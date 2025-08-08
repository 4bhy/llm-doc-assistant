/**
 * Chat Routes
 * 
 * Handles all chat-related API endpoints, including:
 * - Sending messages to the LLM
 * - Retrieving chat history
 * - Managing conversation context
 */

const express = require('express');
const router = express.Router();
// const path = require('path');
// const config = require('../../config/app.config');

const chatController = require('../controllers/chat.controller');

/**
 * @route   POST /api/chat/message
 * @desc    Send a message and get a response from the LLM
 * @access  Public
 */
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Process the message using the chat controller
    const response = await chatController.processMessage(message, conversationId);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in chat message endpoint:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * @route   GET /api/chat/history/:conversationId
 * @desc    Get chat history for a specific conversation
 * @access  Public
 */
router.get('/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const convo = chatController.getConversationHistory(conversationId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.status(200).json(convo);
  } catch (error) {
    console.error('Error in chat history endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * @route   POST /api/chat/escalate
 * @desc    Escalate a conversation to a human admin
 * @access  Public
 */
router.post('/escalate', async (req, res) => {
  try {
    const { conversationId, reason } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const escalation = await chatController.handleEscalation(conversationId, reason || 'User requested assistance');
    res.status(200).json(escalation);
  } catch (error) {
    console.error('Error in escalation endpoint:', error);
    res.status(500).json({ error: 'Failed to escalate conversation' });
  }
});

module.exports = router;
