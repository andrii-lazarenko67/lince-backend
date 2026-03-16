'use strict';

const aiService = require('../services/aiService');
const { Op } = require('sequelize');
const { DailyLog, DailyLogEntry, MonitoringPoint, Parameter, Unit, System, SystemType, Inspection, Incident, IncidentComment, Client } = require('../../db/models');

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
   * Extract values from a lab report image or PDF
   * POST /api/ai/extract-lab-report  (multipart/form-data)
   */
  async extractLabReport(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.fileRequired' });
      }

      if (!aiService.isConfigured()) {
        return res.status(503).json({ success: false, messageKey: 'ai.errors.notConfigured' });
      }

      let monitoringPoints = [];
      try {
        monitoringPoints = JSON.parse(req.body.monitoringPoints || '[]');
      } catch {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.invalidMonitoringPoints' });
      }

      const language = req.body.language || req.user?.language || 'pt';

      const result = await aiService.extractLabReport({
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        monitoringPoints,
        language
      });

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('AI Extract Lab Report Error:', error);
      next(error);
    }
  },

  /**
   * Generate an advanced custom AI report based on a free-form prompt
   * POST /api/ai/advanced-report
   */
  async generateAdvancedReport(req, res, next) {
    try {
      const { prompt, systemIds, period, language } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.messageRequired' });
      }
      if (!systemIds || !Array.isArray(systemIds) || systemIds.length === 0) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.systemsRequired' });
      }
      if (!period?.startDate || !period?.endDate) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.periodRequired' });
      }
      if (!aiService.isConfigured()) {
        return res.status(503).json({ success: false, messageKey: 'ai.errors.notConfigured' });
      }

      const clientId = req.clientId;
      const lang = language || req.user?.language || 'pt';

      // Fetch systems with type
      const systems = await System.findAll({
        where: { id: { [Op.in]: systemIds }, clientId },
        include: [{ model: SystemType, as: 'systemType', attributes: ['name'] }]
      });

      // Fetch client info
      const client = clientId ? await Client.findByPk(clientId, { attributes: ['name'] }) : null;

      // Fetch daily logs with full entry details
      const dailyLogs = await DailyLog.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          date: { [Op.between]: [period.startDate, period.endDate] }
        },
        include: [{
          model: DailyLogEntry,
          as: 'entries',
          include: [{
            model: MonitoringPoint,
            as: 'monitoringPoint',
            include: [
              { model: Parameter, as: 'parameterObj', attributes: ['name'] },
              { model: Unit, as: 'unitObj', attributes: ['abbreviation'] }
            ]
          }]
        }],
        order: [['date', 'ASC']]
      });

      // Fetch inspections
      const inspections = await Inspection.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          date: { [Op.between]: [period.startDate, period.endDate] }
        },
        attributes: ['id', 'title', 'type', 'result', 'status', 'date'],
        order: [['date', 'ASC']]
      });

      // Fetch incidents with comments
      const incidents = await Incident.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          createdAt: { [Op.between]: [period.startDate, period.endDate] }
        },
        include: [{
          model: IncidentComment,
          as: 'comments',
          attributes: ['content'],
          required: false
        }],
        attributes: ['id', 'title', 'status', 'severity', 'createdAt'],
        order: [['createdAt', 'ASC']]
      });

      // Build system name map
      const systemMap = {};
      systems.forEach(s => { systemMap[s.id] = s.name; });

      // Calculate summary
      let totalReadings = 0;
      let outOfRangeCount = 0;

      // Transform daily logs into rich context
      const dailyLogsData = dailyLogs.map(log => {
        const entries = (log.entries || []).map(entry => {
          totalReadings++;
          if (entry.isOutOfRange) outOfRangeCount++;
          const mp = entry.monitoringPoint;
          return {
            parameter: mp?.parameterObj?.name || mp?.name || 'N/A',
            systemName: systemMap[log.systemId] || '',
            value: entry.value,
            unit: mp?.unitObj?.abbreviation || '',
            minValue: mp?.minValue ?? null,
            maxValue: mp?.maxValue ?? null,
            isOutOfRange: entry.isOutOfRange,
            notes: entry.notes || null
          };
        });

        return {
          date: log.date,
          recordType: log.recordType,
          systemName: systemMap[log.systemId] || '',
          laboratory: log.laboratory || null,
          period: log.period || null,
          entries
        };
      });

      const inspectionsData = inspections.map(ins => ({
        date: ins.date,
        title: ins.title || ins.type,
        result: ins.result,
        status: ins.status,
        nonConformities: 0 // simplified
      }));

      const incidentsData = incidents.map(inc => ({
        date: inc.date,
        title: inc.title,
        severity: inc.severity,
        status: inc.status,
        comments: (inc.comments || []).map(c => ({ content: c.content }))
      }));

      const reportContext = {
        clientName: client?.name || '',
        systems: systems.map(s => ({ name: s.name, systemType: s.systemType?.name || '' })),
        period,
        dailyLogsData,
        inspectionsData,
        incidentsData,
        summary: {
          totalReadings,
          withinRangeCount: totalReadings - outOfRangeCount,
          outOfRangeCount,
          totalInspections: inspections.length,
          totalIncidents: incidents.length,
          openIncidents: incidents.filter(i => i.status === 'open').length
        }
      };

      const result = await aiService.generateAdvancedReport({
        prompt: prompt.trim(),
        reportContext,
        language: lang
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('AI Advanced Report Error:', error);
      next(error);
    }
  },

  /**
   * Generate a comprehensive report conclusion using real monitoring data
   * POST /api/ai/report-conclusion
   */
  async generateReportConclusion(req, res, next) {
    try {
      const { instruction, systemIds, period, language } = req.body;

      if (!instruction || !instruction.trim()) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.messageRequired' });
      }
      if (!systemIds || !Array.isArray(systemIds) || systemIds.length === 0) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.systemsRequired' });
      }
      if (!period?.startDate || !period?.endDate) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.periodRequired' });
      }
      if (!aiService.isConfigured()) {
        return res.status(503).json({ success: false, messageKey: 'ai.errors.notConfigured' });
      }

      const clientId = req.clientId;
      const lang = language || req.user?.language || 'pt';

      // Fetch systems with type info
      const systems = await System.findAll({
        where: { id: { [Op.in]: systemIds }, clientId },
        include: [{ model: SystemType, as: 'systemType', attributes: ['name'] }]
      });

      // Fetch client info
      const client = clientId ? await Client.findByPk(clientId, { attributes: ['name'] }) : null;

      // Fetch daily logs with out-of-range entries for the period
      const dailyLogs = await DailyLog.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          date: { [Op.between]: [period.startDate, period.endDate] }
        },
        include: [{
          model: DailyLogEntry,
          as: 'entries',
          include: [{
            model: MonitoringPoint,
            as: 'monitoringPoint',
            include: [
              { model: Parameter, as: 'parameterObj', attributes: ['name'] },
              { model: Unit, as: 'unitObj', attributes: ['abbreviation'] }
            ]
          }]
        }]
      });

      // Extract out-of-range items
      const outOfRangeItems = [];
      let totalReadings = 0;
      dailyLogs.forEach(log => {
        const systemName = systems.find(s => s.id === log.systemId)?.name || '';
        (log.entries || []).forEach(entry => {
          totalReadings++;
          if (entry.isOutOfRange) {
            const mp = entry.monitoringPoint;
            outOfRangeItems.push({
              parameter: mp?.parameterObj?.name || mp?.name || 'Unknown',
              systemName,
              value: entry.value,
              min: mp?.minValue ?? null,
              max: mp?.maxValue ?? null,
              unit: mp?.unitObj?.abbreviation || ''
            });
          }
        });
      });

      // Fetch inspections
      const inspections = await Inspection.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          date: { [Op.between]: [period.startDate, period.endDate] }
        },
        attributes: ['id', 'title', 'type', 'result', 'status'],
        limit: 10
      });

      // Fetch incidents
      const incidents = await Incident.findAll({
        where: {
          systemId: { [Op.in]: systemIds },
          clientId,
          createdAt: { [Op.between]: [period.startDate, period.endDate] }
        },
        attributes: ['id', 'title', 'status', 'severity'],
        limit: 10
      });

      const reportContext = {
        clientName: client?.name || '',
        systems: systems.map(s => ({ name: s.name, systemType: s.systemType?.name || '' })),
        period,
        outOfRangeItems,
        withinRangeCount: totalReadings - outOfRangeItems.length,
        totalReadings,
        inspections: inspections.map(i => ({ title: i.title, type: i.type, result: i.result, status: i.status })),
        incidents: incidents.map(i => ({ title: i.title, status: i.status, severity: i.severity })),
        summary: {
          totalInspections: inspections.length,
          totalIncidents: incidents.length,
          openIncidents: incidents.filter(i => i.status === 'open').length
        }
      };

      const result = await aiService.generateReportConclusion({
        instruction: instruction.trim(),
        reportContext,
        language: lang
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('AI Report Conclusion Error:', error);
      next(error);
    }
  },

  /**
   * Export AI report as Word document
   * POST /api/ai/export-word
   */
  async exportWord(req, res, next) {
    try {
      const { text, filename } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, messageKey: 'ai.errors.messageRequired' });
      }

      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType
      } = require('docx');

      // Parse markdown lines into docx paragraphs
      const lines = text.split('\n');
      const children = [];

      for (const line of lines) {
        if (line.startsWith('# ')) {
          children.push(new Paragraph({
            text: line.slice(2),
            heading: HeadingLevel.HEADING_1
          }));
        } else if (line.startsWith('## ')) {
          children.push(new Paragraph({
            text: line.slice(3),
            heading: HeadingLevel.HEADING_2
          }));
        } else if (line.startsWith('### ')) {
          children.push(new Paragraph({
            text: line.slice(4),
            heading: HeadingLevel.HEADING_3
          }));
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
          children.push(new Paragraph({
            text: line.slice(2),
            bullet: { level: 0 }
          }));
        } else if (line.startsWith('---')) {
          children.push(new Paragraph({ text: '', border: { bottom: { style: 'single', size: 6 } } }));
        } else if (line.trim() === '') {
          children.push(new Paragraph({ text: '' }));
        } else {
          // Handle **bold** wrapping the entire line
          const boldMatch = line.match(/^\*\*(.+)\*\*$/);
          if (boldMatch) {
            children.push(new Paragraph({
              children: [new TextRun({ text: boldMatch[1], bold: true })]
            }));
          } else {
            children.push(new Paragraph({ text: line }));
          }
        }
      }

      const doc = new Document({
        sections: [{ properties: {}, children }]
      });

      const buffer = await Packer.toBuffer(doc);
      const safeFilename = (filename || 'ai-report').replace(/[^a-zA-Z0-9_-]/g, '_');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error('AI Export Word Error:', error);
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
