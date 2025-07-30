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
- **RAG Framework**: LangChain
- **LLM Engine**: llama.cpp

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- C++ build tools
- 16GB+ RAM recommended

### Installation

Detailed installation instructions will be provided in the setup guide.

## Project Structure

```
llm-doc-assistant/
├── frontend/           # Next.js frontend
├── backend/            # Node.js backend
├── models/             # LLM model files
├── data/               # Document corpus
│   ├── raw/            # Original documents
│   └── processed/      # Processed chunks
├── vectorstore/        # ChromaDB storage
├── scripts/            # Utility scripts
│   ├── ingest.js       # Document ingestion
│   └── setup.js        # Environment setup
└── config/             # Configuration files
```

## License

Internal use only. All rights reserved.