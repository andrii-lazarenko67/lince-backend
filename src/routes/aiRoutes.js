'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

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

// Check AI service status
router.get('/status', aiController.getStatus);

module.exports = router;
