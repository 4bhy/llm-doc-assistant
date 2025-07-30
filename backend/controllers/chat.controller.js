/**
 * Chat Controller
 * 
 * Handles chat-related business logic, including:
 * - Processing user messages
 * - Generating responses using LangChain and llama.cpp
 * - Managing conversation history
 * - Handling escalation
 */

const langchainService = require('../services/langchain.service');
const config = require('../../config/app.config');

// In-memory store for conversations (would be replaced with a database in production)
const conversations = new Map();

/**
 * Generate a unique conversation ID
 * @returns {string} - A unique conversation ID
 */
function generateConversationId() {
  return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Process a user message and generate a response
 * @param {string} message - The user's message
 * @param {string} conversationId - The conversation ID
 * @returns {Object} - The response object
 */
async function processMessage(message, conversationId) {
  try {
    // Create a new conversation if needed
    if (!conversationId || !conversations.has(conversationId)) {
      conversationId = generateConversationId();
      conversations.set(conversationId, {
        id: conversationId,
        messages: [
          {
            role: 'system',
            content: 'I am an AI assistant that helps with your documentation.',
            timestamp: new Date().toISOString(),
          }
        ],
        createdAt: new Date().toISOString(),
      });
    }
    
    // Get the conversation
    const conversation = conversations.get(conversationId);
    
    // Add user message to history
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    // Get chat history for context (excluding system message)
    const chatHistory = conversation.messages.slice(1);
    
    // Generate response using LangChain service
    const response = await langchainService.query(message, chatHistory);
    
    // Check if we need to escalate
    let escalate = false;
    if (response.escalate || shouldEscalate(response.text)) {
      escalate = true;
    }
    
    // Add assistant response to history
    conversation.messages.push({
      role: 'assistant',
      content: response.text,
      sources: response.sources || [],
      timestamp: new Date().toISOString(),
    });
    
    // Update conversation in store
    conversations.set(conversationId, conversation);
    
    return {
      text: response.text,
      sources: response.sources || [],
      conversationId,
      escalate,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      text: "I'm sorry, I encountered an error while processing your request.",
      error: error.message,
      conversationId,
      escalate: true,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get conversation history
 * @param {string} conversationId - The conversation ID
 * @returns {Object} - The conversation history
 */
function getConversationHistory(conversationId) {
  if (!conversationId || !conversations.has(conversationId)) {
    return null;
  }
  
  return conversations.get(conversationId);
}

/**
 * Determine if a response should trigger escalation based on content
 * @param {string} text - The response text
 * @returns {boolean} - Whether to escalate
 */
function shouldEscalate(text) {
  // Check for low confidence indicators in the response
  const lowConfidenceIndicators = [
    "I don't know",
    "I'm not sure",
    "I don't have enough information",
    "I cannot answer",
    "I'm unable to provide",
  ];
  
  return lowConfidenceIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
}

/**
 * Handle escalation request
 * @param {string} conversationId - The conversation ID
 * @param {string} reason - The reason for escalation
 * @returns {Object} - The escalation object
 */
async function handleEscalation(conversationId, reason) {
  try {
    if (!conversationId || !conversations.has(conversationId)) {
      throw new Error('Invalid conversation ID');
    }
    
    const escalationId = `esc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // In a real implementation, this would notify admins or store in a database
    console.log(`Escalation requested for conversation ${conversationId}: ${reason}`);
    
    // If notification is enabled, this would send an email or notification
    if (config.escalation.notificationEnabled) {
      // Simulate notification
      console.log(`Notification would be sent to ${config.escalation.adminEmail}`);
    }
    
    return {
      escalationId,
      conversationId,
      reason,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error handling escalation:', error);
    throw error;
  }
}

module.exports = {
  processMessage,
  getConversationHistory,
  handleEscalation,
};
