/**
 * Application Configuration
 * 
 * This file contains all the configuration parameters for the LLM Document Assistant.
 * Modify these settings according to your environment and requirements.
 */

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  },
  
  // Document Processing
  documents: {
    chunkSize: 1000,
    chunkOverlap: 200,
    supportedTypes: ['.pdf', '.docx', '.txt', '.md'],
    dataDir: process.env.DATA_DIR || '../data',
  },
  
  // Vector Database (ChromaDB)
  vectorDb: {
    collectionName: 'document_collection',
    persistDirectory: process.env.VECTOR_DB_DIR || '../vectorstore',
    embeddingDimension: 384, // Depends on the embedding model
  },
  
  // LLM Configuration
  llm: {
    modelPath: process.env.MODEL_PATH || '../models/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    contextWindow: 4096,
    temperature: 0.2,
    topP: 0.9,
    repetitionPenalty: 1.1,
    maxNewTokens: 1024,
  },
  
  // Embedding Model
  embeddings: {
    modelName: 'sentence-transformers/all-MiniLM-L6-v2',
    cacheDir: process.env.EMBEDDINGS_CACHE_DIR || '../models/embeddings',
  },
  
  // RAG Configuration
  rag: {
    retrievalK: 4, // Number of chunks to retrieve
    retrievalStrategy: 'mmr', // 'similarity' or 'mmr'
    diversityFactor: 0.3, // For MMR strategy
  },
  
  // Escalation Configuration
  escalation: {
    confidenceThreshold: 0.7,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    notificationEnabled: true,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || '../logs/app.log',
  },
};
