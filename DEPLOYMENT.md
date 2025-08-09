# LLM Document Assistant - Production Deployment Guide

This guide provides step-by-step instructions for deploying the LLM Document Assistant in a production environment using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git installed on your server
- 16GB+ RAM recommended (for LLM inference)
- 10GB+ disk space for application, models, and document storage

## Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd llm-doc-assistant
```

### 2. Environment Configuration

1. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

2. Edit the environment variables in `backend/.env` to match your production environment:
   - Update `CORS_ORIGINS` to include your frontend domain
   - Configure `DATA_DIR` and `VECTOR_DB_DIR` paths
   - Adjust LLM parameters as needed

3. Create a `.env` file in the project root for Docker Compose:

```bash
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://your-domain.com/api

# Backend Configuration
BACKEND_PORT=3001
BACKEND_HOST=0.0.0.0
CORS_ORIGINS=http://your-domain.com

# ChromaDB Configuration
CHROMA_PORT=8000

# LLM Configuration
LLM_PORT=8080
MODEL_PATH=/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
CONTEXT_SIZE=4096
NUM_THREADS=4
```

### 3. Data Persistence Setup

The Docker Compose configuration already includes volume definitions for persistent storage:

- `document-data`: Stores uploaded and processed documents
- `vector-data`: Stores vector embeddings
- `chroma-data`: Stores ChromaDB database files
- `model-data`: Stores LLM model files

For production, you may want to use named volumes or bind mounts to specific directories on your host:

```yaml
volumes:
  document-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/persistent/documents
  # Similar configuration for other volumes
```

### 4. Building and Starting the Services

1. Build all services:

```bash
docker-compose build
```

2. Start the services:

```bash
docker-compose up -d
```

3. Verify all services are running:

```bash
docker-compose ps
```

### 5. Document Ingestion

To ingest documents into the system:

1. Place your documents in the `data/raw` directory
2. Run the ingestion script:

```bash
docker-compose exec backend node scripts/ingest.js
```

### 6. Scaling and Performance Tuning

#### Memory Allocation

Adjust the memory limits in `docker-compose.yml` based on your server capacity:

```yaml
llama-cpp:
  deploy:
    resources:
      limits:
        memory: 8G  # Adjust based on your model and server capacity
```

#### ChromaDB Performance

For large document collections, consider adjusting ChromaDB settings:

```yaml
chromadb:
  environment:
    - CHROMA_DB_IMPL=duckdb+parquet
    - CHROMA_PERSISTENCE_DIRECTORY=/chroma/chroma
```

#### Backend Scaling

For high-traffic deployments, consider using a load balancer with multiple backend instances:

```yaml
backend:
  deploy:
    replicas: 3
```

### 7. Security Considerations

1. **API Security**: Consider adding an API gateway with rate limiting and authentication
2. **Network Isolation**: Use Docker networks to isolate services
3. **HTTPS**: Configure SSL/TLS for all public-facing services
4. **Environment Variables**: Ensure sensitive information is only stored in environment variables, not in code

### 8. Monitoring and Logging

1. Configure logging to external services:

```yaml
backend:
  environment:
    - LOG_LEVEL=info
    - LOG_TO_FILE=true
    - LOG_FILE_PATH=/logs/app.log
  volumes:
    - ./logs:/logs
```

2. Consider adding monitoring tools like Prometheus and Grafana

### 9. Backup Strategy

1. Regularly backup the following volumes:
   - `document-data`
   - `vector-data`
   - `chroma-data`

2. Example backup script:

```bash
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Stop services
docker-compose stop

# Backup volumes
docker run --rm -v llm-doc-assistant_document-data:/data -v $BACKUP_DIR:/backup \
  ubuntu tar -czf /backup/document-data.tar.gz /data

docker run --rm -v llm-doc-assistant_vector-data:/data -v $BACKUP_DIR:/backup \
  ubuntu tar -czf /backup/vector-data.tar.gz /data

docker run --rm -v llm-doc-assistant_chroma-data:/data -v $BACKUP_DIR:/backup \
  ubuntu tar -czf /backup/chroma-data.tar.gz /data

# Restart services
docker-compose start
```

### 10. Troubleshooting

#### Service Health Checks

The backend includes a health check endpoint at `/api/health` that can be used to verify the system is functioning correctly.

#### Common Issues

1. **LLM Server Connection Issues**:
   - Check if the LLM server is running: `docker-compose logs llama-cpp`
   - Verify the model file exists and is accessible

2. **ChromaDB Connection Issues**:
   - Check ChromaDB logs: `docker-compose logs chromadb`
   - Verify network connectivity between backend and ChromaDB

3. **Document Processing Failures**:
   - Check backend logs for processing errors: `docker-compose logs backend`
   - Verify file permissions on document directories

## Maintenance

### Updating the Application

1. Pull the latest code:

```bash
git pull origin main
```

2. Rebuild and restart services:

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Updating the LLM Model

1. Download the new model to the `models` directory
2. Update the `MODEL_PATH` in your `.env` file
3. Restart the llama-cpp service:

```bash
docker-compose restart llama-cpp
```

## Production Checklist

Before going live, ensure you have:

- [ ] Configured proper environment variables
- [ ] Set up persistent storage for all data
- [ ] Implemented proper backup strategy
- [ ] Configured security measures (HTTPS, authentication)
- [ ] Tested document ingestion and retrieval
- [ ] Verified LLM responses and RAG functionality
- [ ] Set up monitoring and alerting
- [ ] Documented maintenance procedures
