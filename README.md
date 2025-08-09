# LLM Document Assistant

An internal AI assistant that answers questions about an organization's private documentation.

## Overview

This application provides a chat interface for querying internal documentation using a local large language model. It uses a retrieval-augmented generation (RAG) approach to provide accurate, contextual answers based on your organization's private documents.

## Features

- **Private & Secure**: All components run locally or on-premise
- **Document Processing**: Ingest various document formats (PDF, DOCX, MD, TXT)
- **Semantic Search**: Find relevant document sections using vector embeddings
- **Local LLM Inference**: Generate responses using llama.cpp
- **Admin Escalation**: Fallback to human experts when needed

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Node.js with Express
- **Vector Database**: ChromaDB
- **RAG Framework**: LangChain with HuggingFaceTransformersEmbeddings
- **LLM Engine**: llama.cpp with REST API interface

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- C++ build tools
- 16GB+ RAM recommended

### Installation

### Installation Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd llm-doc-assistant
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up the LLM
   ```bash
   cd ../scripts
   bash setup_llama.sh
   ```

5. Configure the application in `config/app.config.js`

6. Start the services
   ```bash
   # Start ChromaDB
   docker run -d -p 8000:8000 chromadb/chroma
   
   # Start backend
   cd ../backend
   npm start
   
   # Start frontend
   cd ../frontend
   npm run dev
   ```

## Project Structure

```
llm-doc-assistant/
├── frontend/           # Next.js frontend
│   ├── src/            # Frontend source code
│   └── public/         # Static assets
├── backend/            # Node.js backend
│   ├── controllers/    # API controllers
│   ├── routes/         # API routes
│   ├── services/       # Core services
│   │   ├── langchain.service.js  # RAG pipeline implementation
│   │   └── processor.js          # Document processing
│   └── server.js       # Express server setup
├── models/             # LLM model files
├── data/               # Document corpus
│   ├── raw/            # Original documents
│   └── processed/      # Processed chunks
├── vectorstore/        # ChromaDB storage
├── scripts/            # Utility scripts
│   └── setup_llama.sh  # LLM setup script
└── config/             # Configuration files
    └── app.config.js   # Application configuration
```

## License

Internal use only. All rights reserved.