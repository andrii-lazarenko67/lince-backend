'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const aiInsightsMiddleware = require('../middlewares/aiInsightsMiddleware');
const planMiddleware = require('../middlewares/planMiddleware');

// All AI routes require authentication
router.use(authMiddleware);

// Chat with AI assistant
router.post('/chat', aiInsightsMiddleware, aiController.chat);

// Analyze water quality data
router.post('/analyze-water-quality', aiInsightsMiddleware, aiController.analyzeWaterQuality);

// Get setup suggestions
router.post('/setup-suggestions', aiInsightsMiddleware, aiController.getSetupSuggestions);

// Get contextual help
router.post('/contextual-help', aiInsightsMiddleware, aiController.getContextualHelp);

// Interpret alerts
router.post('/interpret-alert', aiInsightsMiddleware, aiController.interpretAlert);

// Extract values from a lab report (image or PDF)
router.post('/extract-lab-report', planMiddleware('pro', 'enterprise'), upload.single('file'), aiInsightsMiddleware, aiController.extractLabReport);

// Generate comprehensive report conclusion with real monitoring data
router.post('/report-conclusion', aiInsightsMiddleware, aiController.generateReportConclusion);

// Generate advanced custom AI report from free-form prompt
router.post('/advanced-report', planMiddleware('pro', 'enterprise'), aiInsightsMiddleware, aiController.generateAdvancedReport);

// Export AI report as Word document
router.post('/export-word', planMiddleware('pro', 'enterprise'), aiController.exportWord);

// Check AI service status
router.get('/status', aiController.getStatus);

module.exports = router;
