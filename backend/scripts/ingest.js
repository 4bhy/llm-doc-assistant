/**
 * Document Ingestion Script
 * 
 * This script processes documents from the data/raw directory,
 * converts them to embeddings, and stores them in ChromaDB.
 * 
 * Usage: node ingest.js [--file path/to/specific/file.pdf]
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Chroma } = require("langchain/vectorstores/chroma");
const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
const config = require('../../config/app.config');

// Parse command line arguments
program
  .option('-f, --file <path>', 'Process a specific file')
  .option('-r, --reset', 'Reset the vector database before ingestion')
  .parse(process.argv);

const options = program.opts();

// Configure paths
const dataDir = path.resolve(__dirname, '../../data');
const rawDir = path.join(dataDir, 'raw');
const processedDir = path.join(dataDir, 'processed');
const vectorStoreDir = path.resolve(__dirname, '../../vectorstore');

// Ensure directories exist
[dataDir, rawDir, processedDir, vectorStoreDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure document loaders
const loaders = {
  '.pdf': (filePath) => new PDFLoader(filePath),
  '.docx': (filePath) => new DocxLoader(filePath),
  '.txt': (filePath) => new TextLoader(filePath),
  '.md': (filePath) => new TextLoader(filePath),
};

// Configure text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.documents.chunkSize,
  chunkOverlap: config.documents.chunkOverlap,
});

// Configure embeddings
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: config.embeddings.modelName,
  cacheDir: config.embeddings.cacheDir,
});

/**
 * Process a single document file
 * @param {string} filePath - Path to the document file
 */
async function processFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!loaders[ext]) {
      console.warn(`Unsupported file type: ${ext} for file ${filePath}`);
      return;
    }
    
    console.log(`Processing file: ${filePath}`);
    
    // Load the document
    const loader = loaders[ext](filePath);
    const docs = await loader.load();
    
    console.log(`Loaded ${docs.length} document(s) from ${filePath}`);
    
    // Split the document into chunks
    const splitDocs = await textSplitter.splitDocuments(docs);
    
    console.log(`Split into ${splitDocs.length} chunks`);
    
    // Add metadata
    const processedDocs = splitDocs.map((doc, i) => {
      const fileName = path.basename(filePath);
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          source: fileName,
          chunk: i,
          filePath: filePath,
        },
      };
    });
    
    // Store in ChromaDB
    await Chroma.fromDocuments(
      processedDocs,
      embeddings,
      {
        collectionName: config.vectorDb.collectionName,
        url: "http://localhost:8000", // ChromaDB server URL
        collectionMetadata: {
          "hnsw:space": "cosine",
        },
      }
    );
    
    console.log(`Successfully stored ${processedDocs.length} chunks in ChromaDB`);
    
    // Track processed file
    const processedFilePath = path.join(
      processedDir,
      `${path.basename(filePath, ext)}.json`
    );
    
    fs.writeFileSync(
      processedFilePath,
      JSON.stringify({
        originalFile: filePath,
        chunks: processedDocs.length,
        processedAt: new Date().toISOString(),
      })
    );
    
    console.log(`File processing complete: ${filePath}`);
    return processedDocs.length;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return 0;
  }
}

/**
 * Process all documents in the raw directory
 */
async function processAllDocuments() {
  try {
    // Get all files in the raw directory
    const files = fs.readdirSync(rawDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return config.documents.supportedTypes.includes(ext);
      })
      .map(file => path.join(rawDir, file));
    
    console.log(`Found ${files.length} document(s) to process`);
    
    // Process each file
    let totalChunks = 0;
    for (const file of files) {
      const chunks = await processFile(file);
      totalChunks += chunks;
    }
    
    console.log(`Ingestion complete. Processed ${files.length} files with ${totalChunks} total chunks.`);
  } catch (error) {
    console.error('Error processing documents:', error);
  }
}

/**
 * Reset the vector database
 */
async function resetVectorStore() {
  try {
    console.log('Resetting vector database...');
    
    // Create a client to delete the collection
    const client = new Chroma({
      collectionName: config.vectorDb.collectionName,
      url: "http://localhost:8000",
      embeddingFunction: embeddings,
    });
    
    // Delete the collection
    await client.delete();
    
    console.log('Vector database reset complete.');
  } catch (error) {
    console.error('Error resetting vector database:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting document ingestion process...');
  
  // Reset vector store if requested
  if (options.reset) {
    await resetVectorStore();
  }
  
  // Process a specific file or all documents
  if (options.file) {
    const filePath = path.resolve(options.file);
    if (fs.existsSync(filePath)) {
      await processFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
    }
  } else {
    await processAllDocuments();
  }
  
  console.log('Document ingestion process complete.');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
