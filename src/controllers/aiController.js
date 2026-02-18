'use strict';

const aiService = require('../services/aiService');

const aiController = {
  /**
   * Chat with AI assistant
   * POST /api/ai/chat
   */
  async chat(req, res, next) {
    try {
      const { message, conversationHistory, context, language } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          messageKey: 'ai.errors.messageRequired'
        });
      }

      // Check if AI service is configured
      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'ai.errors.notConfigured'
        });
      }

      const response = await aiService.chat({
        message: message.trim(),
        conversationHistory: conversationHistory || [],
        context: context || {},
        language: language || req.user?.language || 'pt'
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI Chat Error:', error);
      next(error);
    }
  },

  /**
   * Analyze water quality data
   * POST /api/ai/analyze-water-quality
   */
  async analyzeWaterQuality(req, res, next) {
    try {
      const { measurements, systemType, language } = req.body;

      if (!measurements || !Array.isArray(measurements)) {
        return res.status(400).json({
          success: false,
          messageKey: 'ai.errors.measurementsRequired'
        });
      }

      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'ai.errors.notConfigured'
        });
      }

      const response = await aiService.analyzeWaterQuality({
        measurements,
        systemType: systemType || 'water treatment system',
        language: language || req.user?.language || 'pt'
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI Water Quality Analysis Error:', error);
      next(error);
    }
  },

  /**
   * Get setup suggestions for a new system
   * POST /api/ai/setup-suggestions
   */
  async getSetupSuggestions(req, res, next) {
    try {
      const { systemType, capacity, usage, language } = req.body;

      if (!systemType) {
        return res.status(400).json({
          success: false,
          messageKey: 'ai.errors.systemTypeRequired'
        });
      }

      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'ai.errors.notConfigured'
        });
      }

      const response = await aiService.getSetupSuggestions({
        systemType,
        capacity: capacity || 'not specified',
        usage: usage || 'general',
        language: language || req.user?.language || 'pt'
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI Setup Suggestions Error:', error);
      next(error);
    }
  },

  /**
   * Get contextual help for current page
   * POST /api/ai/contextual-help
   */
  async getContextualHelp(req, res, next) {
    try {
      const { page, feature, language } = req.body;

      if (!page) {
        return res.status(400).json({
          success: false,
          messageKey: 'ai.errors.pageRequired'
        });
      }

      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'ai.errors.notConfigured'
        });
      }

      const response = await aiService.getContextualHelp({
        page,
        feature: feature || null,
        language: language || req.user?.language || 'pt'
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI Contextual Help Error:', error);
      next(error);
    }
  },

  /**
   * Interpret an alert and get recommendations
   * POST /api/ai/interpret-alert
   */
  async interpretAlert(req, res, next) {
    try {
      const { alert, systemType, language } = req.body;

      if (!alert) {
        return res.status(400).json({
          success: false,
          messageKey: 'ai.errors.alertRequired'
        });
      }

      if (!aiService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'ai.errors.notConfigured'
        });
      }

      const response = await aiService.interpretAlert({
        alert,
        systemType: systemType || 'water treatment system',
        language: language || req.user?.language || 'pt'
      });

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI Alert Interpretation Error:', error);
      next(error);
    }
  },

  /**
   * Check AI service status
   * GET /api/ai/status
   */
  async getStatus(req, res, next) {
    try {
      const isConfigured = aiService.isConfigured();

      res.json({
        success: true,
        data: {
          configured: isConfigured,
          available: isConfigured
        }
      });
    } catch (error) {
      console.error('AI Status Error:', error);
      next(error);
    }
  }
};

module.exports = aiController;
