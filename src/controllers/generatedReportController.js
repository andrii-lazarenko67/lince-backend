const { GeneratedReport, ReportTemplate, User, Client, System, SystemType, DailyLog, DailyLogEntry, MonitoringPoint, Inspection, InspectionItem, InspectionPhoto, Incident, IncidentPhoto, IncidentComment, Product, ProductUsage, ChecklistItem, SystemPhoto, UserClient } = require('../../db/models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');
const chartDataService = require('../services/chartDataService');
const { generateWordDocument } = require('../services/wordDocumentService');
const emailService = require('../services/emailService');

const generatedReportController = {
  // Get all generated reports (history)
  async getAll(req, res, next) {
    try {
      const clientId = req.clientId;
      const { page = 1, limit = 20, templateId, startDate, endDate } = req.query;

      const whereClause = { userId: req.user.id };

      // Client filtering for service provider mode
      if (clientId) {
        // Specific client selected
        whereClause.clientId = clientId;
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected but service provider - show all their clients' reports
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          whereClause.clientId = { [Op.in]: clientIds };
        } else {
          // No clients - return empty
          whereClause.clientId = -1;
        }
      }

      if (templateId) {
        whereClause.templateId = parseInt(templateId);
      }

      if (startDate && endDate) {
        whereClause.generatedAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await GeneratedReport.findAndCountAll({
        where: whereClause,
        include: [
          { model: ReportTemplate, as: 'template', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ],
        order: [['generatedAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get a single generated report
  async getById(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [
          { model: ReportTemplate, as: 'template' },
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: Client, as: 'client' }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate a new report and save to history
  async generate(req, res, next) {
    try {
      const {
        templateId,
        name,
        systemIds,
        period,
        config,
        conclusion,
        signature
      } = req.body;

      // Support both nested period object and flat fields for backwards compatibility
      const periodType = period?.type || req.body.periodType;
      const startDate = period?.startDate || req.body.startDate;
      const endDate = period?.endDate || req.body.endDate;

      const clientId = req.clientId || req.body.clientId;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      // Calculate date range based on period type
      // IMPORTANT: If user provides explicit startDate and endDate, ALWAYS use those dates
      // The periodType only affects the default when no dates are provided
      let start, end;
      const now = new Date();

      // If explicit dates are provided, use them regardless of periodType
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        // Fall back to periodType-based defaults when no dates provided
        switch (periodType) {
          case 'daily':
            start = new Date(now.toISOString().split('T')[0]);
            end = new Date(start);
            end.setDate(end.getDate() + 1);
            break;
          case 'weekly':
            start = new Date(now);
            start.setDate(start.getDate() - 7);
            end = new Date(now);
            break;
          case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'custom':
            return res.status(400).json({
              success: false,
              messageKey: 'reports.errors.datesRequired'
            });
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now);
        }
      }

      // Fetch template if provided
      let template = null;
      if (templateId) {
        template = await ReportTemplate.findByPk(templateId);
      }

      // Use provided config or template config or default
      const reportConfig = config || template?.config || {
        blocks: [
          { type: 'identification', enabled: true, order: 1 },
          { type: 'scope', enabled: true, order: 2 },
          { type: 'systems', enabled: true, order: 3 },
          { type: 'analyses', enabled: true, order: 4 },
          { type: 'inspections', enabled: true, order: 5 },
          { type: 'occurrences', enabled: true, order: 6 },
          { type: 'conclusion', enabled: true, order: 7 },
          { type: 'signature', enabled: true, order: 8 }
        ],
        branding: {
          showLogo: true,
          logoPosition: 'left',
          showHeader: true,
          headerText: 'Technical Report',
          showFooter: true
        }
      };

      // Build system filter - only fetch parent systems (parentId is null)
      // to avoid fetching children as top-level items
      const systemFilter = systemIds && systemIds.length > 0
        ? { id: { [Op.in]: systemIds }, clientId, parentId: { [Op.is]: null } }
        : { clientId, parentId: { [Op.is]: null } };

      // Fetch systems with their type and children (stages/sub-systems)
      const systems = await System.findAll({
        where: systemFilter,
        include: [
          { model: SystemPhoto, as: 'photos' },
          { model: SystemType, as: 'systemType', attributes: ['id', 'name'] },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'status', 'description'],
            include: [{ model: SystemType, as: 'systemType', attributes: ['id', 'name'] }]
          }
        ]
      });

      // Build list of all system IDs including children (stages)
      const systemIdList = systems.map(s => s.id);
      const allSystemIds = [...systemIdList];
      systems.forEach(s => {
        if (s.children && s.children.length > 0) {
          allSystemIds.push(...s.children.map(c => c.id));
        }
      });

      // Fetch daily logs with entries
      const dailyLogs = await DailyLog.findAll({
        where: {
          clientId,
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch inspections
      // Use start of start day to end of end day to ensure inclusive date range
      const inspectionStartDate = new Date(start);
      inspectionStartDate.setHours(0, 0, 0, 0);
      const inspectionEndDate = new Date(end);
      inspectionEndDate.setHours(23, 59, 59, 999);

      const inspections = await Inspection.findAll({
        where: {
          clientId,
          date: { [Op.between]: [inspectionStartDate, inspectionEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch incidents (occurrences)
      // Use start of start day to end of end day to ensure inclusive date range
      const incidentStartDate = new Date(start);
      incidentStartDate.setHours(0, 0, 0, 0);
      const incidentEndDate = new Date(end);
      incidentEndDate.setHours(23, 59, 59, 999);

      const incidents = await Incident.findAll({
        where: {
          clientId,
          createdAt: { [Op.between]: [incidentStartDate, incidentEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: User, as: 'assignee', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Fetch products
      const products = await Product.findAll({
        where: { clientId, isActive: true },
        order: [['name', 'ASC']]
      });

      // Fetch product usages
      const productUsages = await ProductUsage.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: Product, as: 'product' },
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['date', 'DESC']]
      });

      // Get client info
      const client = await Client.findByPk(clientId);

      // Calculate summary statistics
      let totalReadings = 0;
      let outOfRangeCount = 0;
      dailyLogs.forEach(log => {
        totalReadings += log.entries?.length || 0;
        outOfRangeCount += log.entries?.filter(e => e.isOutOfRange).length || 0;
      });

      // Build report data
      const reportData = {
        client: {
          id: client.id,
          name: client.name,
          address: client.address,
          contact: client.contact,
          phone: client.phone,
          email: client.email,
          logo: client.logo,
          brandColor: client.brandColor
        },
        period: {
          type: periodType,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        systems,
        dailyLogs,
        inspections,
        incidents,
        products,
        productUsages,
        summary: {
          totalSystems: systems.length,
          totalReadings,
          outOfRangeCount,
          totalInspections: inspections.length,
          totalIncidents: incidents.length,
          openIncidents: incidents.filter(i => i.status === 'open').length,
          totalProducts: products.length
        },
        conclusion: conclusion || '',
        signature: signature || null,
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: req.user.id,
          name: req.user.name
        }
      };

      // Prepare chart data if charts are enabled
      let chartData = null;
      const analysesBlock = reportConfig.blocks?.find(b => b.type === 'analyses');

      // Check for charts - support both old chartConfig.enabled and new fieldChartConfig/laboratoryChartConfig structure
      const hasFieldChartConfig = analysesBlock?.fieldChartConfig;
      const hasLabChartConfig = analysesBlock?.laboratoryChartConfig;
      const hasOldChartConfig = analysesBlock?.chartConfig?.enabled;
      const shouldIncludeCharts = analysesBlock?.includeCharts && (hasFieldChartConfig || hasLabChartConfig || hasOldChartConfig);

      if (shouldIncludeCharts) {
        // Use fieldChartConfig, laboratoryChartConfig, or fallback to old chartConfig
        const fieldChartCfg = analysesBlock.fieldChartConfig || analysesBlock.chartConfig || {};
        const labChartCfg = analysesBlock.laboratoryChartConfig || analysesBlock.chartConfig || {};

        // Determine aggregation level based on report period type
        const determineAggregation = (periodType, startDate, endDate) => {
          if (periodType === 'daily') return 'daily';
          if (periodType === 'weekly') return 'weekly';
          if (periodType === 'monthly') return 'monthly';

          // For custom periods, determine based on date range
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 14) return 'daily';
          if (daysDiff <= 90) return 'weekly';
          return 'monthly';
        };

        const aggregation = determineAggregation(periodType, start, end);

        // Get monitoring point IDs from filters (user selection) or config, or use all from the systems
        const filters = req.body.filters || {};
        let chartMonitoringPointIds = filters.selectedMonitoringPointIds ||
                                      fieldChartCfg.parameters?.map(p => p.monitoringPointId) ||
                                      [];

        // If no specific monitoring points selected, get top 5 by data volume
        if (chartMonitoringPointIds.length === 0) {
          const allMps = await MonitoringPoint.findAll({
            where: allSystemIds.length > 0 ? { systemId: { [Op.in]: allSystemIds } } : {},
            attributes: ['id'],
            limit: 5
          });
          chartMonitoringPointIds = allMps.map(mp => mp.id);
        }

        // Prepare field charts with period-based aggregation
        const fieldCharts = await chartDataService.prepareChartData({
          clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'field'
        });

        // Prepare laboratory charts with period-based aggregation
        const laboratoryCharts = await chartDataService.prepareChartData({
          clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'laboratory'
        });

        // Apply colors from config - separate for field and laboratory
        const applyFieldColors = (charts) => {
          const defaultColors = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
          return charts.map((chart, index) => {
            const paramConfig = fieldChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || fieldChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: fieldChartCfg.chartType || 'bar'
            };
          });
        };

        const applyLabColors = (charts) => {
          const defaultColors = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
          return charts.map((chart, index) => {
            const paramConfig = labChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || labChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: labChartCfg.chartType || 'bar'
            };
          });
        };

        chartData = {
          fieldCharts: applyFieldColors(fieldCharts),
          laboratoryCharts: applyLabColors(laboratoryCharts),
          fieldChartConfig: fieldChartCfg,
          laboratoryChartConfig: labChartCfg
        };
      }

      // Add chartData to reportData
      reportData.chartData = chartData;

      // Generate report name if not provided
      const reportName = name || `Report - ${client.name} - ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

      // Save to history (PDF generation happens on frontend with react-pdf)
      const filters = req.body.filters || {};
      const generatedReport = await GeneratedReport.create({
        templateId: templateId || null,
        userId: req.user.id,
        clientId,
        name: reportName,
        systemIds: allSystemIds,
        period: {
          type: periodType,
          start: start.toISOString(),
          end: end.toISOString()
        },
        filters: {
          ...filters,
          periodType,
          systemIds,
          config: reportConfig,
          conclusion: conclusion || '',
          signature: signature || null
        },
        config: reportConfig,
        pdfUrl: null, // Will be updated when PDF is uploaded
        generatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: {
          report: generatedReport,
          reportData
        },
        messageKey: 'reports.generated'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a generated report (e.g., to add PDF URL after generation)
  async update(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      const { name, pdfUrl, publicId } = req.body;

      await report.update({
        name: name !== undefined ? name : report.name,
        pdfUrl: pdfUrl !== undefined ? pdfUrl : report.pdfUrl,
        publicId: publicId !== undefined ? publicId : report.publicId
      });

      res.json({
        success: true,
        data: report,
        messageKey: 'reports.history.updated'
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload PDF for a generated report
  async uploadPdf(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'reports.errors.noFileUploaded'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'lince/reports',
            public_id: `report-${report.id}-${Date.now()}`,
            resource_type: 'raw'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Delete old PDF from Cloudinary if exists
      if (report.publicId) {
        try {
          await cloudinary.uploader.destroy(report.publicId, { resource_type: 'raw' });
        } catch (err) {
          // Ignore errors deleting old file
        }
      }

      // Update report with new PDF URL
      await report.update({
        pdfUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      });

      res.json({
        success: true,
        data: { pdfUrl: uploadResult.secure_url },
        messageKey: 'reports.pdfUploaded'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a generated report
  async delete(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      // Delete PDF from Cloudinary if exists
      if (report.publicId) {
        try {
          await cloudinary.uploader.destroy(report.publicId, { resource_type: 'raw' });
        } catch (err) {
          // Ignore errors
        }
      }

      await report.destroy();

      res.json({
        success: true,
        messageKey: 'reports.history.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  // Download/get PDF URL
  async download(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      if (!report.pdfUrl) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.errors.pdfNotGenerated'
        });
      }

      res.json({
        success: true,
        data: {
          url: report.pdfUrl,
          name: report.name
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate and download Word document
  async downloadWord(req, res, next) {
    try {
      const report = await GeneratedReport.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [
          { model: ReportTemplate, as: 'template' },
          { model: Client, as: 'client' }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      // Get language from query parameter or default to 'pt'
      const language = req.query.language || 'pt';

      // Get period from report
      const period = report.period || {};
      const start = period.start ? new Date(period.start) : new Date();
      const end = period.end ? new Date(period.end) : new Date();

      // Get system IDs from report
      const systemIds = report.systemIds || [];

      // Build system filter for parent systems
      const systemFilter = systemIds.length > 0
        ? { id: { [Op.in]: systemIds }, clientId: report.clientId, parentId: { [Op.is]: null } }
        : { clientId: report.clientId, parentId: { [Op.is]: null } };

      // Fetch systems with children
      const systems = await System.findAll({
        where: systemFilter,
        include: [
          { model: SystemPhoto, as: 'photos' },
          { model: SystemType, as: 'systemType', attributes: ['id', 'name'] },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'status', 'description'],
            include: [{ model: SystemType, as: 'systemType', attributes: ['id', 'name'] }]
          }
        ]
      });

      // Build list of all system IDs including children
      const allSystemIds = [...systemIds];
      systems.forEach(s => {
        if (s.children && s.children.length > 0) {
          allSystemIds.push(...s.children.map(c => c.id));
        }
      });

      // Fetch daily logs
      const dailyLogs = await DailyLog.findAll({
        where: {
          clientId: report.clientId,
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch inspections
      const inspectionStartDate = new Date(start);
      inspectionStartDate.setHours(0, 0, 0, 0);
      const inspectionEndDate = new Date(end);
      inspectionEndDate.setHours(23, 59, 59, 999);

      const inspections = await Inspection.findAll({
        where: {
          clientId: report.clientId,
          date: { [Op.between]: [inspectionStartDate, inspectionEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch incidents
      const incidentStartDate = new Date(start);
      incidentStartDate.setHours(0, 0, 0, 0);
      const incidentEndDate = new Date(end);
      incidentEndDate.setHours(23, 59, 59, 999);

      const incidents = await Incident.findAll({
        where: {
          clientId: report.clientId,
          createdAt: { [Op.between]: [incidentStartDate, incidentEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: User, as: 'assignee', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calculate summary statistics
      let totalReadings = 0;
      let outOfRangeCount = 0;
      dailyLogs.forEach(log => {
        totalReadings += log.entries?.length || 0;
        outOfRangeCount += log.entries?.filter(e => e.isOutOfRange).length || 0;
      });

      // Build report data structure
      const reportData = {
        client: {
          id: report.client?.id,
          name: report.client?.name,
          address: report.client?.address,
          contact: report.client?.contact,
          phone: report.client?.phone,
          email: report.client?.email,
          logo: report.client?.logo,
          brandColor: report.client?.brandColor
        },
        period: {
          type: period.type || 'custom',
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        systems,
        dailyLogs,
        inspections,
        incidents,
        summary: {
          totalSystems: systems.length,
          totalReadings,
          outOfRangeCount,
          totalInspections: inspections.length,
          totalIncidents: incidents.length,
          openIncidents: incidents.filter(i => i.status === 'open').length
        },
        conclusion: report.filters?.conclusion || '',
        signature: report.filters?.signature || null,
        generatedAt: report.generatedAt || new Date().toISOString(),
        generatedBy: {
          id: req.user.id,
          name: req.user.name
        },
        isServiceProvider: req.user.isServiceProvider || false
      };

      // Get config from report or template
      const config = report.config || report.template?.config || {
        blocks: [
          { type: 'identification', enabled: true, order: 1 },
          { type: 'scope', enabled: true, order: 2 },
          { type: 'systems', enabled: true, order: 3 },
          { type: 'analyses', enabled: true, order: 4 },
          { type: 'inspections', enabled: true, order: 5 },
          { type: 'occurrences', enabled: true, order: 6 },
          { type: 'conclusion', enabled: true, order: 7 },
          { type: 'signature', enabled: true, order: 8 }
        ],
        branding: {
          showLogo: true,
          logoPosition: 'left',
          showHeader: true,
          headerText: 'Technical Report',
          showFooter: true
        }
      };

      // Prepare chart data if charts are enabled
      let chartData = null;
      const analysesBlock = config.blocks?.find(b => b.type === 'analyses');

      // Check for charts - support both old chartConfig.enabled and new fieldChartConfig/laboratoryChartConfig structure
      const hasFieldChartConfig = analysesBlock?.fieldChartConfig;
      const hasLabChartConfig = analysesBlock?.laboratoryChartConfig;
      const hasOldChartConfig = analysesBlock?.chartConfig?.enabled;
      const shouldIncludeCharts = analysesBlock?.includeCharts && (hasFieldChartConfig || hasLabChartConfig || hasOldChartConfig);

      if (shouldIncludeCharts) {
        // Use fieldChartConfig, laboratoryChartConfig, or fallback to old chartConfig
        const fieldChartCfg = analysesBlock.fieldChartConfig || analysesBlock.chartConfig || {};
        const labChartCfg = analysesBlock.laboratoryChartConfig || analysesBlock.chartConfig || {};

        // Determine aggregation level based on report period type
        const determineAggregation = (periodType, startDate, endDate) => {
          if (periodType === 'daily') return 'daily';
          if (periodType === 'weekly') return 'weekly';
          if (periodType === 'monthly') return 'monthly';

          // For custom periods, determine based on date range
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 14) return 'daily';
          if (daysDiff <= 90) return 'weekly';
          return 'monthly';
        };

        const aggregation = determineAggregation(period.type, start, end);

        // Get monitoring point IDs from filters (user selection) or config, or use all from the systems
        let chartMonitoringPointIds = report.filters?.selectedMonitoringPointIds ||
                                      fieldChartCfg.parameters?.map(p => p.monitoringPointId) ||
                                      [];

        // If no specific monitoring points selected, get top 5 by data volume
        if (chartMonitoringPointIds.length === 0) {
          const { MonitoringPoint } = require('../../db/models');
          const allMps = await MonitoringPoint.findAll({
            where: allSystemIds.length > 0 ? { systemId: { [Op.in]: allSystemIds } } : {},
            attributes: ['id'],
            limit: 5
          });
          chartMonitoringPointIds = allMps.map(mp => mp.id);
        }

        // Prepare field charts with period-based aggregation
        const fieldCharts = await chartDataService.prepareChartData({
          clientId: report.clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'field'
        });

        // Prepare laboratory charts with period-based aggregation
        const laboratoryCharts = await chartDataService.prepareChartData({
          clientId: report.clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'laboratory'
        });

        // Apply colors from config - separate for field and laboratory
        const applyFieldColors = (charts) => {
          const defaultColors = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
          return charts.map((chart, index) => {
            const paramConfig = fieldChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || fieldChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: fieldChartCfg.chartType || 'bar'
            };
          });
        };

        const applyLabColors = (charts) => {
          const defaultColors = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
          return charts.map((chart, index) => {
            const paramConfig = labChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || labChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: labChartCfg.chartType || 'bar'
            };
          });
        };

        chartData = {
          fieldCharts: applyFieldColors(fieldCharts),
          laboratoryCharts: applyLabColors(laboratoryCharts),
          fieldChartConfig: fieldChartCfg,
          laboratoryChartConfig: labChartCfg
        };
      }

      // Generate Word document (pass template logo, chart data, and language if available)
      const templateLogo = report.template?.logo || null;
      const docBuffer = await generateWordDocument(reportData, config, report.name, templateLogo, chartData, language);

      // Set response headers for file download
      const filename = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', docBuffer.length);

      // Send the buffer
      res.send(docBuffer);

    } catch (error) {
      console.error('Error generating Word document:', error);
      next(error);
    }
  },

  // Send report via email (Word format)
  async sendReportEmail(req, res, next) {
    try {
      const { id } = req.params;
      const { to, cc, bcc, language } = req.body;

      if (!to || !to.trim()) {
        return res.status(400).json({
          success: false,
          messageKey: 'reports.email.errors.recipientRequired'
        });
      }

      // Check if email service is configured
      if (!emailService.isConfigured()) {
        return res.status(503).json({
          success: false,
          messageKey: 'reports.email.errors.notConfigured'
        });
      }

      // Fetch report
      const report = await GeneratedReport.findOne({
        where: { id, userId: req.user.id },
        include: [
          { model: ReportTemplate, as: 'template' },
          { model: Client, as: 'client' }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.history.errors.notFound'
        });
      }

      // Get period from report
      const period = report.period || {};
      const start = period.start ? new Date(period.start) : new Date();
      const end = period.end ? new Date(period.end) : new Date();

      // Format period for email
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR');
      };
      const periodText = `${formatDate(start)} - ${formatDate(end)}`;

      // Get system IDs from report
      const systemIds = report.systemIds || [];

      // Build system filter for parent systems
      const systemFilter = systemIds.length > 0
        ? { id: { [Op.in]: systemIds }, clientId: report.clientId, parentId: { [Op.is]: null } }
        : { clientId: report.clientId, parentId: { [Op.is]: null } };

      // Fetch systems with children
      const systems = await System.findAll({
        where: systemFilter,
        include: [
          { model: SystemPhoto, as: 'photos' },
          { model: SystemType, as: 'systemType', attributes: ['id', 'name'] },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'status', 'description'],
            include: [{ model: SystemType, as: 'systemType', attributes: ['id', 'name'] }]
          }
        ]
      });

      // Build list of all system IDs including children (stages)
      const systemIdList = systems.map(s => s.id);
      const allSystemIds = [...systemIdList];
      systems.forEach(s => {
        if (s.children && s.children.length > 0) {
          allSystemIds.push(...s.children.map(c => c.id));
        }
      });

      // Fetch daily logs with entries
      const dailyLogs = await DailyLog.findAll({
        where: {
          clientId: report.clientId,
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch inspections
      const inspectionStartDate = new Date(start);
      inspectionStartDate.setHours(0, 0, 0, 0);
      const inspectionEndDate = new Date(end);
      inspectionEndDate.setHours(23, 59, 59, 999);

      const inspections = await Inspection.findAll({
        where: {
          clientId: report.clientId,
          date: { [Op.between]: [inspectionStartDate, inspectionEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC']]
      });

      // Fetch incidents
      const incidentStartDate = new Date(start);
      incidentStartDate.setHours(0, 0, 0, 0);
      const incidentEndDate = new Date(end);
      incidentEndDate.setHours(23, 59, 59, 999);

      const incidents = await Incident.findAll({
        where: {
          clientId: report.clientId,
          createdAt: { [Op.between]: [incidentStartDate, incidentEndDate] },
          ...(allSystemIds.length > 0 && { systemId: { [Op.in]: allSystemIds } })
        },
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: User, as: 'assignee', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Build report data
      const reportData = {
        client: report.client,
        period: {
          type: period.type,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        systems,
        dailyLogs,
        inspections,
        incidents,
        conclusion: report.filters?.conclusion || '',
        signature: report.filters?.signature || null,
        generatedAt: report.generatedAt,
        generatedBy: {
          id: req.user.id,
          name: req.user.name
        }
      };

      // Get config
      const config = report.config || report.template?.config || {};

      // Prepare chart data if needed
      let chartData = null;
      const analysesBlock = config.blocks?.find(b => b.type === 'analyses');
      const shouldIncludeCharts = analysesBlock?.includeCharts;

      if (shouldIncludeCharts) {
        const fieldChartCfg = analysesBlock.fieldChartConfig || analysesBlock.chartConfig || {};
        const labChartCfg = analysesBlock.laboratoryChartConfig || analysesBlock.chartConfig || {};

        // Determine aggregation
        const determineAggregation = (periodType, startDate, endDate) => {
          if (periodType === 'daily') return 'daily';
          if (periodType === 'weekly') return 'weekly';
          if (periodType === 'monthly') return 'monthly';

          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 14) return 'daily';
          if (daysDiff <= 90) return 'weekly';
          return 'monthly';
        };

        const aggregation = determineAggregation(period.type, start, end);

        let chartMonitoringPointIds = report.filters?.selectedMonitoringPointIds ||
                                      fieldChartCfg.parameters?.map(p => p.monitoringPointId) ||
                                      [];

        if (chartMonitoringPointIds.length === 0) {
          const allMps = await MonitoringPoint.findAll({
            where: allSystemIds.length > 0 ? { systemId: { [Op.in]: allSystemIds } } : {},
            attributes: ['id'],
            limit: 5
          });
          chartMonitoringPointIds = allMps.map(mp => mp.id);
        }

        const fieldCharts = await chartDataService.prepareChartData({
          clientId: report.clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'field'
        });

        const laboratoryCharts = await chartDataService.prepareChartData({
          clientId: report.clientId,
          systemIds: allSystemIds,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          monitoringPointIds: chartMonitoringPointIds,
          aggregation: aggregation,
          recordType: 'laboratory'
        });

        const defaultColors = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
        const applyFieldColors = (charts) => {
          return charts.map((chart, index) => {
            const paramConfig = fieldChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || fieldChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: fieldChartCfg.chartType || 'bar'
            };
          });
        };

        const applyLabColors = (charts) => {
          return charts.map((chart, index) => {
            const paramConfig = labChartCfg.parameters?.find(p => p.monitoringPointId === chart.monitoringPointId);
            return {
              ...chart,
              color: paramConfig?.color || labChartCfg.colors?.primary || defaultColors[index % defaultColors.length],
              showSpecLimit: paramConfig?.showSpecLimit !== false,
              chartType: labChartCfg.chartType || 'bar'
            };
          });
        };

        chartData = {
          fieldCharts: applyFieldColors(fieldCharts),
          laboratoryCharts: applyLabColors(laboratoryCharts),
          fieldChartConfig: fieldChartCfg,
          laboratoryChartConfig: labChartCfg
        };
      }

      // Generate Word document
      const templateLogo = report.template?.logo || null;
      const docBuffer = await generateWordDocument(reportData, config, report.name, templateLogo, chartData, language || 'pt');

      // Send email with Word attachment
      await emailService.sendReportWithWord({
        to: to.trim(),
        reportName: report.name,
        clientName: report.client?.name,
        period: periodText,
        docBuffer,
        language: language || 'pt',
        cc: cc || [],
        bcc: bcc || []
      });

      res.json({
        success: true,
        messageKey: 'reports.email.sent'
      });
    } catch (error) {
      console.error('Error sending report email:', error);
      next(error);
    }
  }
};

module.exports = generatedReportController;
// Fixed chart aggregation to respect report period type
