/**
 * Document Processing Service
 * - Ingests uploaded files (PDF, DOCX, MD, TXT)
 * - Splits into chunks
 * - Generates embeddings and stores in ChromaDB
 * - Tracks processed documents
 */

const fs = require('fs');
const path = require('path');
const { Chroma } = require('langchain/vectorstores/chroma');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/hf_transformers');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { DocxLoader } = require('langchain/document_loaders/fs/docx');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const config = require('../../config/app.config');

const rootDir = path.resolve(__dirname, '../../');
const dataDir = path.resolve(rootDir, 'data');
const rawDir = path.join(dataDir, 'raw');
const processedDir = path.join(dataDir, 'processed');

// Ensure directories exist
for (const dir of [dataDir, rawDir, processedDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const loaders = {
  '.pdf': (filePath) => new PDFLoader(filePath),
  '.docx': (filePath) => new DocxLoader(filePath),
  '.txt': (filePath) => new TextLoader(filePath),
  '.md': (filePath) => new TextLoader(filePath),
};

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.documents.chunkSize,
  chunkOverlap: config.documents.chunkOverlap,
});

// Lazily initialize embeddings once
let embeddingsInstance = null;
async function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new HuggingFaceTransformersEmbeddings({
      modelName: config.embeddings.modelName,
      cacheDir: config.embeddings.cacheDir,
    });
  }
  return embeddingsInstance;
}

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!loaders[ext]) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const fileName = path.basename(filePath);
  const id = fileName; // Use filename as id for MVP

  // Load
  const loader = loaders[ext](filePath);
  const docs = await loader.load();

  // Split
  const splitDocs = await textSplitter.splitDocuments(docs);

  // Add metadata
  const processedDocs = splitDocs.map((doc, i) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      source: fileName,
      chunk: i,
      filePath,
      uploadedAt: new Date().toISOString(),
    },
  }));

  // Store in ChromaDB
  const embeddings = await getEmbeddings();
  await Chroma.fromDocuments(processedDocs, embeddings, {
    collectionName: config.vectorDb.collectionName,
    url: config.vectorDb.url,
    collectionMetadata: { 'hnsw:space': 'cosine' },
  });

  // Track processed file
  const info = {
    id,
    originalFile: filePath,
    filename: fileName,
    chunks: processedDocs.length,
    processedAt: new Date().toISOString(),
    filetype: ext,
  };
  fs.writeFileSync(path.join(processedDir, `${path.basename(filePath, ext)}.json`), JSON.stringify(info, null, 2));

  return info;
}

function listProcessedDocuments() {
  if (!fs.existsSync(processedDir)) return [];
  const files = fs.readdirSync(processedDir).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    try {
      const full = path.join(processedDir, f);
      const meta = JSON.parse(fs.readFileSync(full, 'utf-8'));
      const stat = fs.statSync(full);
      return {
        id: meta.id || meta.filename || path.basename(f, '.json'),
        filename: meta.filename || `${path.basename(f, '.json')}${meta.filetype || ''}`,
        status: 'processed',
        chunks: meta.chunks,
        uploadedAt: meta.processedAt,
        updatedAt: stat.mtime.toISOString(),
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

function getDocumentDetails(id) {
  const base = path.basename(id, path.extname(id));
  const metaFile = path.join(processedDir, `${base}.json`);
  if (!fs.existsSync(metaFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
  } catch (e) {
    return null;
  }
}

async function deleteDocument(id) {
  const embeddings = await getEmbeddings();
  const client = new Chroma({
    collectionName: config.vectorDb.collectionName,
    url: config.vectorDb.url,
    embeddingFunction: embeddings,
  });

  // Delete all vectors with metadata.source === filename
  const filename = id;
  if (client && client.delete) {
    await client.delete({ where: { source: filename } });
  }

  // Remove processed JSON
  const base = path.basename(id, path.extname(id));
  const metaFile = path.join(processedDir, `${base}.json`);
  if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);

  // Optionally keep raw file to allow re-ingest; do not delete raw file for safety
  return { success: true };
}

module.exports = {
  processFile,
  listProcessedDocuments,
  getDocumentDetails,
  deleteDocument,
  paths: { dataDir, rawDir, processedDir },
};
