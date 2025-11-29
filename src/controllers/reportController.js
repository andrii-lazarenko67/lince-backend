const { DailyLog, DailyLogEntry, MonitoringPoint, Inspection, InspectionItem, Incident, System, User } = require('../../db/models');
const { Op } = require('sequelize');

const reportController = {
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

      // Calculate statistics
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
      start.setDate(start.getDate() - start.getDay()); // Start of week
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

      // Group data by day
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

      // Calculate averages per monitoring point
      const averages = {};
      dailyLogs.forEach(log => {
        log.entries.forEach(entry => {
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

module.exports = reportController;
