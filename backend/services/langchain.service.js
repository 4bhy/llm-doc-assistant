/**
 * LangChain Service
 * 
 * This service handles the Retrieval-Augmented Generation (RAG) pipeline using LangChain.
 * It connects to ChromaDB for document retrieval and the llama.cpp server for inference.
 */

const { Chroma } = require("langchain/vectorstores/chroma");
const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
const { RunnableSequence, RunnablePassthrough } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { formatDocumentsAsString } = require("langchain/util/document");
const { PromptTemplate } = require("@langchain/core/prompts");
const axios = require('axios');
const config = require('../../config/app.config');

class LangChainService {
  constructor() {
    this.initialized = false;
    this.vectorStore = null;
    this.chain = null;
    this.embeddings = null;
  }

  /**
   * Initialize the LangChain service
   */
  async initialize() {
    try {
      console.log('Initializing LangChain service...');
      
      // Initialize embeddings
      this.embeddings = new HuggingFaceTransformersEmbeddings({
        modelName: config.embeddings.modelName,
        cacheDir: config.embeddings.cacheDir,
      });
      
      // Connect to ChromaDB
      this.vectorStore = new Chroma({
        collectionName: config.vectorDb.collectionName,
        url: "http://localhost:8000", // ChromaDB server URL
        embeddingFunction: this.embeddings,
      });
      
      // Create retriever
      this.retriever = this.vectorStore.asRetriever({
        k: config.rag.retrievalK,
        searchType: config.rag.retrievalStrategy,
        ...(config.rag.retrievalStrategy === 'mmr' && {
          fetchK: config.rag.retrievalK * 3,
          lambda: config.rag.diversityFactor,
        }),
      });
      
      // Create prompt templates
      this.questionGeneratorTemplate = PromptTemplate.fromTemplate(
        `Given the following conversation and a follow-up question, rephrase the follow-up question to be a standalone question that captures all relevant context from the conversation.

        Chat History:
        {chatHistory}
        
        Follow-up question: {question}
        
        Standalone question:`
      );
      
      this.qaTemplate = PromptTemplate.fromTemplate(
        `You are an AI assistant for answering questions about internal documentation.
        Use the following pieces of retrieved context to answer the question.
        If you don't know the answer, just say that you don't know.
        Use three sentences maximum and keep the answer concise.
        
        Question: {question}
        
        Context:
        {context}
        
        Answer:`
      );
      
      // Create the RAG chain
      this.chain = RunnableSequence.from([
        {
          question: new RunnablePassthrough(),
          chatHistory: () => "", // Will be populated in query method
        },
        {
          question: this.questionGeneratorTemplate.pipe(new StringOutputParser()),
          chatHistory: ({ chatHistory }) => chatHistory,
        },
        {
          context: ({ question }) => this.retrieveDocuments(question),
          question: ({ question }) => question,
        },
        this.qaTemplate,
        this.callLlamaServer,
      ]);
      
      this.initialized = true;
      console.log('LangChain service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Error initializing LangChain service:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Retrieve relevant documents from ChromaDB
   * @param {string} query - The user's query
   * @returns {string} - Formatted document context
   */
  async retrieveDocuments(query) {
    try {
      const docs = await this.retriever.getRelevantDocuments(query);
      return formatDocumentsAsString(docs);
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return "";
    }
  }

  /**
   * Call the llama.cpp server for inference
   * @param {string} prompt - The formatted prompt
   * @returns {string} - The LLM response
   */
  async callLlamaServer(prompt) {
    try {
      // Configure the request to the llama.cpp server
      const response = await axios.post('http://localhost:8080/completion', {
        prompt,
        temperature: config.llm.temperature,
        top_p: config.llm.topP,
        n_predict: config.llm.maxNewTokens,
        repeat_penalty: config.llm.repetitionPenalty,
      }, {
        timeout: 30000, // 30 seconds timeout
      });
      
      return response.data.content;
    } catch (error) {
      console.error('Error calling llama.cpp server:', error);
      return "I'm sorry, I encountered an error while processing your request.";
    }
  }

  /**
   * Process a user query
   * @param {string} query - The user's query
   * @param {Array} chatHistory - The chat history
   * @returns {Object} - The response with text and sources
   */
  async query(query, chatHistory = []) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Format chat history
      const formattedHistory = chatHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      // Run the chain
      const response = await this.chain.invoke({
        question: query,
        chatHistory: formattedHistory,
      });
      
      // Get sources
      const docs = await this.retriever.getRelevantDocuments(query);
      const sources = docs.map(doc => ({
        source: doc.metadata.source,
        page: doc.metadata.page || null,
        chunk: doc.metadata.chunk || null,
      }));
      
      return {
        text: response,
        sources,
      };
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Check if we should escalate
      const shouldEscalate = this.shouldEscalate(error);
      
      return {
        text: "I'm sorry, I encountered an error while processing your request.",
        error: error.message,
        escalate: shouldEscalate,
      };
    }
  }

  /**
   * Determine if an error should trigger escalation
   * @param {Error} error - The error object
   * @returns {boolean} - Whether to escalate
   */
  shouldEscalate(error) {
    // Implement escalation logic based on error type
    const criticalErrors = [
      'ECONNREFUSED', // LLM server connection refused
      'ETIMEDOUT',    // Request timeout
      'no documents', // No relevant documents found
    ];
    
    return criticalErrors.some(errType => 
      error.message.includes(errType) || 
      (error.code && error.code.includes(errType))
    );
  }

  /**
   * Check if the service is healthy
   * @returns {boolean} - Service health status
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return false;
      }
      
      // Check ChromaDB connection
      await this.vectorStore.collection.count();
      
      // Check llama.cpp server
      await axios.get('http://localhost:8080/health');
      
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new LangChainService();
