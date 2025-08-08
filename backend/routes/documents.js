/**
 * Document Routes
 * 
 * Handles all document-related API endpoints, including:
 * - Document ingestion
 * - Document listing
 * - Document status
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const processor = require('../services/processor');

/**
 * @route   GET /api/documents
 * @desc    Get a list of all ingested documents
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const documents = processor.listProcessedDocuments();
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error in documents list endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

/**
 * @route   POST /api/documents/ingest
 * @desc    Ingest a new document
 * @access  Public
 */
router.post('/ingest', async (req, res) => {
  try {
    const { filepath } = req.body;
    if (!filepath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    const absPath = path.isAbsolute(filepath) ? filepath : path.resolve(filepath);
    const info = await processor.processFile(absPath);
    res.status(200).json({ success: true, document: info });
  } catch (error) {
    console.error('Error in document ingestion endpoint:', error);
    res.status(500).json({ error: 'Failed to ingest document' });
  }
});

/**
 * @route   GET /api/documents/:documentId
 * @desc    Get details about a specific document
 * @access  Public
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    const details = processor.getDocumentDetails(documentId);
    if (!details) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json(details);
  } catch (error) {
    console.error('Error in document details endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve document details' });
  }
});

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Delete a document from the system
 * @access  Public
 */
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    await processor.deleteDocument(documentId);
    res.status(200).json({ success: true, message: `Document ${documentId} deleted successfully` });
  } catch (error) {
    console.error('Error in document deletion endpoint:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
