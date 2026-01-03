const { GeneratedReport, ReportTemplate, User, Client, System, DailyLog, DailyLogEntry, MonitoringPoint, Inspection, InspectionItem, InspectionPhoto, Incident, IncidentPhoto, IncidentComment, Product, ProductUsage, ChecklistItem, SystemPhoto } = require('../../db/models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');

const generatedReportController = {
  // Get all generated reports (history)
  async getAll(req, res, next) {
    try {
      const clientId = req.clientId;
      const { page = 1, limit = 20, templateId, startDate, endDate } = req.query;

      const whereClause = { userId: req.user.id };

      if (clientId) {
        whereClause.clientId = clientId;
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
        periodType,
        startDate,
        endDate,
        config,
        conclusion,
        signature
      } = req.body;

      const clientId = req.clientId || req.body.clientId;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      // Calculate date range based on period type
      let start, end;
      const now = new Date();

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
          if (!startDate || !endDate) {
            return res.status(400).json({
              success: false,
              messageKey: 'reports.errors.datesRequired'
            });
          }
          start = new Date(startDate);
          end = new Date(endDate);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now);
      }

      // Fetch template if provided
      let template = null;
      if (templateId) {
        template = await ReportTemplate.findByPk(templateId);
      }

      // Use provided config or template config or default
      const reportConfig = config || template?.config || {
        blocks: [
          { type: 'identification', enabled: true },
          { type: 'scope', enabled: true },
          { type: 'systems', enabled: true },
          { type: 'analyses', enabled: true },
          { type: 'inspections', enabled: true },
          { type: 'occurrences', enabled: true },
          { type: 'conclusion', enabled: true },
          { type: 'signature', enabled: true }
        ]
      };

      // Build system filter
      const systemFilter = systemIds && systemIds.length > 0
        ? { id: { [Op.in]: systemIds }, clientId }
        : { clientId };

      // Fetch systems
      const systems = await System.findAll({
        where: systemFilter,
        include: [{ model: SystemPhoto, as: 'photos' }]
      });

      const systemIdList = systems.map(s => s.id);

      // Fetch daily logs with entries
      const dailyLogs = await DailyLog.findAll({
        where: {
          clientId,
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...(systemIdList.length > 0 && { systemId: { [Op.in]: systemIdList } })
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
      const inspections = await Inspection.findAll({
        where: {
          clientId,
          date: { [Op.between]: [start, end] },
          ...(systemIdList.length > 0 && { systemId: { [Op.in]: systemIdList } })
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
      const incidents = await Incident.findAll({
        where: {
          clientId,
          createdAt: { [Op.between]: [start, end] },
          ...(systemIdList.length > 0 && { systemId: { [Op.in]: systemIdList } })
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
          ...(systemIdList.length > 0 && { systemId: { [Op.in]: systemIdList } })
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

      // Generate report name if not provided
      const reportName = name || `Report - ${client.name} - ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

      // Save to history (PDF generation happens on frontend with react-pdf)
      const generatedReport = await GeneratedReport.create({
        templateId: templateId || null,
        userId: req.user.id,
        clientId,
        name: reportName,
        systemIds: systemIdList,
        period: { start: start.toISOString(), end: end.toISOString() },
        filters: { periodType, systemIds, config: reportConfig },
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
  }
};

module.exports = generatedReportController;
