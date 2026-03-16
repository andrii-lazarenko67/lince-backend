'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// All AI routes require authentication
router.use(authMiddleware);

// Chat with AI assistant
router.post('/chat', aiController.chat);

// Analyze water quality data
router.post('/analyze-water-quality', aiController.analyzeWaterQuality);

// Get setup suggestions
router.post('/setup-suggestions', aiController.getSetupSuggestions);

// Get contextual help
router.post('/contextual-help', aiController.getContextualHelp);

// Interpret alerts
router.post('/interpret-alert', aiController.interpretAlert);

// Extract values from a lab report (image or PDF)
router.post('/extract-lab-report', upload.single('file'), aiController.extractLabReport);

// Generate comprehensive report conclusion with real monitoring data
router.post('/report-conclusion', aiController.generateReportConclusion);

// Generate advanced custom AI report from free-form prompt
router.post('/advanced-report', aiController.generateAdvancedReport);

// Export AI report as Word document
router.post('/export-word', aiController.exportWord);

// Check AI service status
router.get('/status', aiController.getStatus);

module.exports = router;
