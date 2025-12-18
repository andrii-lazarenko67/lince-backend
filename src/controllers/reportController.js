const { DailyLog, DailyLogEntry, MonitoringPoint, Inspection, InspectionItem, InspectionPhoto, Incident, IncidentPhoto, IncidentComment, System, User, Product, ProductUsage, ChecklistItem } = require('../../db/models');
const { Op } = require('sequelize');

const reportController = {
  async generate(req, res, next) {
    try {
      const { type, systemIds, stageIds, startDate, endDate } = req.body;

      // Calculate date range based on type
      let start, end;
      const now = new Date();

      switch (type) {
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
              message: 'Start date and end date are required for custom reports'
            });
          }
          start = new Date(startDate);
          end = new Date(endDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }

      // Build system filter
      const systemFilter = systemIds && systemIds.length > 0
        ? { systemId: { [Op.in]: systemIds } }
        : {};

      // Build stage filter
      const stageFilter = stageIds && stageIds.length > 0
        ? { stageId: { [Op.in]: stageIds } }
        : {};

      // Fetch daily logs with all associations
      const dailyLogs = await DailyLog.findAll({
        where: {
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'user' },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      // Fetch inspections with all associations
      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'user' },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      // Fetch incidents with all associations
      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'reporter' },
          { model: User, as: 'assignee' },
          { model: System, as: 'system' },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user' }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Fetch all products with current stock
      const products = await Product.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']]
      });

      // Fetch product usages filtered by date range and optionally by system
      const productUsageFilter = {
        date: { [Op.between]: [start, end] }
      };
      if (systemIds && systemIds.length > 0) {
        productUsageFilter.systemId = { [Op.in]: systemIds };
      }

      const productUsages = await ProductUsage.findAll({
        where: productUsageFilter,
        include: [
          { model: Product, as: 'product' },
          { model: User, as: 'user' },
          { model: System, as: 'system' }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      const report = {
        type,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        dailyLogs,
        inspections,
        incidents,
        products,
        productUsages,
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  async exportPDF(req, res, next) {
    try {
      const { type, systemIds, startDate, endDate } = req.body;

      // Generate report data first
      const reportData = await generateReportData(type, systemIds, startDate, endDate);

      // Create simple HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>LINCE Report - ${type}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1a56db; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>LINCE Water Treatment Report</h1>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Period:</strong> ${reportData.period.startDate} to ${reportData.period.endDate}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

          <h2>Summary</h2>
          <table>
            <tr>
              <th>Total Readings</th>
              <th>Out of Range</th>
              <th>Inspections</th>
              <th>Incidents</th>
              <th>Products</th>
              <th>Product Usages</th>
            </tr>
            <tr>
              <td>${reportData.summary.totalReadings}</td>
              <td>${reportData.summary.outOfRangeCount}</td>
              <td>${reportData.summary.inspectionsCount}</td>
              <td>${reportData.summary.incidentsCount}</td>
              <td>${reportData.summary.productsCount}</td>
              <td>${reportData.summary.productUsagesCount}</td>
            </tr>
          </table>

          <h2>Daily Logs (${reportData.dailyLogs.length})</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>System</th>
              <th>User</th>
              <th>Entries</th>
              <th>Notes</th>
            </tr>
            ${reportData.dailyLogs.map(log => `
              <tr>
                <td>${log.date}</td>
                <td>${log.system?.name || '-'}</td>
                <td>${log.user?.name || '-'}</td>
                <td>${log.entries?.length || 0}</td>
                <td>${log.notes || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Inspections (${reportData.inspections.length})</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>System</th>
              <th>User</th>
              <th>Status</th>
              <th>Items</th>
            </tr>
            ${reportData.inspections.map(insp => `
              <tr>
                <td>${new Date(insp.date).toLocaleDateString()}</td>
                <td>${insp.system?.name || '-'}</td>
                <td>${insp.user?.name || '-'}</td>
                <td>${insp.status}</td>
                <td>${insp.items?.length || 0}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Incidents (${reportData.incidents.length})</h2>
          <table>
            <tr>
              <th>Title</th>
              <th>System</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reporter</th>
            </tr>
            ${reportData.incidents.map(inc => `
              <tr>
                <td>${inc.title}</td>
                <td>${inc.system?.name || '-'}</td>
                <td>${inc.priority}</td>
                <td>${inc.status}</td>
                <td>${inc.reporter?.name || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Products (${reportData.products.length})</h2>
          <table>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Min Alert</th>
            </tr>
            ${reportData.products.map(prod => `
              <tr>
                <td>${prod.name}</td>
                <td>${prod.type}</td>
                <td>${prod.currentStock}</td>
                <td>${prod.unit}</td>
                <td>${prod.minStockAlert || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Product Usages (${reportData.productUsages.length})</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>System</th>
              <th>User</th>
            </tr>
            ${reportData.productUsages.map(usage => `
              <tr>
                <td>${new Date(usage.date).toLocaleDateString()}</td>
                <td>${usage.product?.name || '-'}</td>
                <td>${usage.type}</td>
                <td>${usage.quantity}</td>
                <td>${usage.system?.name || '-'}</td>
                <td>${usage.user?.name || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      // Set headers for HTML download (client can print to PDF)
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.html`);
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  async exportCSV(req, res, next) {
    try {
      const { type, systemIds, startDate, endDate } = req.body;

      // Generate report data first
      const reportData = await generateReportData(type, systemIds, startDate, endDate);

      // Create CSV content
      let csv = 'LINCE Water Treatment Report\n';
      csv += `Type,${type}\n`;
      csv += `Period,${reportData.period.startDate} to ${reportData.period.endDate}\n`;
      csv += `Generated,${new Date().toISOString()}\n\n`;

      csv += 'Summary\n';
      csv += 'Total Readings,Out of Range,Inspections,Incidents,Products,Product Usages\n';
      csv += `${reportData.summary.totalReadings},${reportData.summary.outOfRangeCount},${reportData.summary.inspectionsCount},${reportData.summary.incidentsCount},${reportData.summary.productsCount},${reportData.summary.productUsagesCount}\n\n`;

      csv += 'Daily Logs\n';
      csv += 'Date,System,User,Entries Count,Notes\n';
      reportData.dailyLogs.forEach(log => {
        csv += `"${log.date}","${log.system?.name || ''}","${log.user?.name || ''}",${log.entries?.length || 0},"${(log.notes || '').replace(/"/g, '""')}"\n`;
      });

      csv += '\nInspections\n';
      csv += 'Date,System,User,Status,Items Count\n';
      reportData.inspections.forEach(insp => {
        csv += `"${new Date(insp.date).toLocaleDateString()}","${insp.system?.name || ''}","${insp.user?.name || ''}","${insp.status}",${insp.items?.length || 0}\n`;
      });

      csv += '\nIncidents\n';
      csv += 'Title,System,Priority,Status,Reporter\n';
      reportData.incidents.forEach(inc => {
        csv += `"${(inc.title || '').replace(/"/g, '""')}","${inc.system?.name || ''}","${inc.priority}","${inc.status}","${inc.reporter?.name || ''}"\n`;
      });

      csv += '\nProducts\n';
      csv += 'Name,Type,Current Stock,Unit,Min Alert\n';
      reportData.products.forEach(prod => {
        csv += `"${prod.name}","${prod.type}",${prod.currentStock},"${prod.unit}",${prod.minStockAlert || ''}\n`;
      });

      csv += '\nProduct Usages\n';
      csv += 'Date,Product,Type,Quantity,System,User\n';
      reportData.productUsages.forEach(usage => {
        csv += `"${new Date(usage.date).toLocaleDateString()}","${usage.product?.name || ''}","${usage.type}",${usage.quantity},"${usage.system?.name || ''}","${usage.user?.name || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  async getDailyReport(req, res, next) {
    try {
      const { date, systemId } = req.query;
      const reportDate = date || new Date().toISOString().split('T')[0];

      const where = { date: reportDate };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: {
            [Op.gte]: new Date(reportDate),
            [Op.lt]: new Date(new Date(reportDate).getTime() + 24 * 60 * 60 * 1000)
          },
          ...(systemId && { systemId })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(reportDate),
            [Op.lt]: new Date(new Date(reportDate).getTime() + 24 * 60 * 60 * 1000)
          },
          ...(systemId && { systemId })
        },
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ]
      });

      const outOfRangeCount = dailyLogs.reduce((acc, log) => {
        return acc + log.entries.filter(e => e.isOutOfRange).length;
      }, 0);

      res.json({
        success: true,
        data: {
          date: reportDate,
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            outOfRangeReadings: outOfRangeCount
          },
          dailyLogs,
          inspections,
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyReport(req, res, next) {
    try {
      const { startDate, systemId } = req.query;
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const where = {
        date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] }
      };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'ASC']]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const dailyData = {};
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        dailyData[dayStr] = {
          logs: dailyLogs.filter(l => l.date === dayStr).length,
          inspections: inspections.filter(i => i.date.toISOString().split('T')[0] === dayStr).length,
          incidents: incidents.filter(i => i.createdAt.toISOString().split('T')[0] === dayStr).length
        };
      }

      res.json({
        success: true,
        data: {
          period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            openIncidents: incidents.filter(i => i.status === 'open').length,
            resolvedIncidents: incidents.filter(i => i.status === 'resolved').length
          },
          dailyData,
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyReport(req, res, next) {
    try {
      const { month, year, systemId } = req.query;
      const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      const reportYear = year ? parseInt(year) : new Date().getFullYear();

      const start = new Date(reportYear, reportMonth, 1);
      const end = new Date(reportYear, reportMonth + 1, 0);

      const where = {
        date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] }
      };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const averages = {};
      dailyLogs.forEach(log => {
        log.entries.forEach(entry => {
          if (entry.monitoringPoint) {
            const key = `${entry.monitoringPoint.systemId}-${entry.monitoringPoint.name}`;
            if (!averages[key]) {
              averages[key] = {
                systemId: entry.monitoringPoint.systemId,
                name: entry.monitoringPoint.name,
                unit: entry.monitoringPoint.unit,
                values: [],
                outOfRange: 0
              };
            }
            averages[key].values.push(parseFloat(entry.value));
            if (entry.isOutOfRange) averages[key].outOfRange++;
          }
        });
      });

      Object.keys(averages).forEach(key => {
        const values = averages[key].values;
        averages[key].average = values.reduce((a, b) => a + b, 0) / values.length;
        averages[key].min = Math.min(...values);
        averages[key].max = Math.max(...values);
        averages[key].count = values.length;
        delete averages[key].values;
      });

      res.json({
        success: true,
        data: {
          period: {
            month: reportMonth + 1,
            year: reportYear,
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            approvedInspections: inspections.filter(i => i.status === 'approved').length
          },
          averages: Object.values(averages),
          incidentsByPriority: {
            critical: incidents.filter(i => i.priority === 'critical').length,
            high: incidents.filter(i => i.priority === 'high').length,
            medium: incidents.filter(i => i.priority === 'medium').length,
            low: incidents.filter(i => i.priority === 'low').length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSystemReport(req, res, next) {
    try {
      const { systemId } = req.params;
      const { startDate, endDate } = req.query;

      const system = await System.findByPk(systemId, {
        include: [{ model: MonitoringPoint, as: 'monitoringPoints' }]
      });

      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = { [Op.between]: [startDate, endDate] };
      }

      const dailyLogs = await DailyLog.findAll({
        where: { systemId, ...dateFilter },
        include: [
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']],
        limit: 30
      });

      const inspections = await Inspection.findAll({
        where: { systemId },
        order: [['date', 'DESC']],
        limit: 10
      });

      const incidents = await Incident.findAll({
        where: { systemId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          system,
          recentLogs: dailyLogs,
          recentInspections: inspections,
          recentIncidents: incidents,
          summary: {
            totalMonitoringPoints: system.monitoringPoints.length,
            openIncidents: incidents.filter(i => i.status === 'open').length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to generate report data
async function generateReportData(type, systemIds, startDate, endDate) {
  let start, end;
  const now = new Date();

  switch (type) {
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
      start = new Date(startDate);
      end = new Date(endDate);
      break;
  }

  const systemFilter = systemIds && systemIds.length > 0
    ? { systemId: { [Op.in]: systemIds } }
    : {};

  // Fetch daily logs with all associations
  const dailyLogs = await DailyLog.findAll({
    where: {
      date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'user' },
      { model: System, as: 'system' },
      {
        model: DailyLogEntry,
        as: 'entries',
        include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
      }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Fetch inspections with all associations
  const inspections = await Inspection.findAll({
    where: {
      date: { [Op.between]: [start, end] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'user' },
      { model: System, as: 'system' },
      {
        model: InspectionItem,
        as: 'items',
        include: [{ model: ChecklistItem, as: 'checklistItem' }]
      },
      { model: InspectionPhoto, as: 'photos' }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Fetch incidents with all associations
  const incidents = await Incident.findAll({
    where: {
      createdAt: { [Op.between]: [start, end] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'assignee' },
      { model: System, as: 'system' },
      { model: IncidentPhoto, as: 'photos' },
      {
        model: IncidentComment,
        as: 'comments',
        include: [{ model: User, as: 'user' }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Fetch all products with current stock
  const products = await Product.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });

  // Fetch product usages filtered by date range and optionally by system
  const productUsageFilter = {
    date: { [Op.between]: [start, end] }
  };
  if (systemIds && systemIds.length > 0) {
    productUsageFilter.systemId = { [Op.in]: systemIds };
  }

  const productUsages = await ProductUsage.findAll({
    where: productUsageFilter,
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'user' },
      { model: System, as: 'system' }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Calculate summary for export functions
  let totalReadings = 0;
  let outOfRangeCount = 0;
  dailyLogs.forEach(log => {
    totalReadings += log.entries?.length || 0;
    outOfRangeCount += log.entries?.filter(e => e.isOutOfRange).length || 0;
  });

  return {
    type,
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    },
    dailyLogs,
    inspections,
    incidents,
    products,
    productUsages,
    summary: {
      totalReadings,
      outOfRangeCount,
      inspectionsCount: inspections.length,
      incidentsCount: incidents.length,
      productsCount: products.length,
      productUsagesCount: productUsages.length
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = reportController;
