const { System, DailyLog, DailyLogEntry, Inspection, Incident, Product, Notification, User, MonitoringPoint } = require('../../db/models');
const { Op } = require('sequelize');

const dashboardController = {
  async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get counts
      const totalSystems = await System.count({ where: { status: 'active' } });
      const totalUsers = await User.count({ where: { isActive: true } });

      const todayLogs = await DailyLog.count({ where: { date: today } });
      const weekLogs = await DailyLog.count({
        where: { date: { [Op.gte]: weekAgo.toISOString().split('T')[0] } }
      });

      const openIncidents = await Incident.count({ where: { status: 'open' } });
      const totalIncidentsThisWeek = await Incident.count({
        where: { createdAt: { [Op.gte]: weekAgo } }
      });

      const pendingInspections = await Inspection.count({ where: { status: 'pending' } });
      const inspectionsThisWeek = await Inspection.count({
        where: { date: { [Op.gte]: weekAgo } }
      });

      // Low stock products
      const products = await Product.findAll({ where: { isActive: true } });
      const lowStockProducts = products.filter(p =>
        p.minStockAlert && parseFloat(p.currentStock) <= parseFloat(p.minStockAlert)
      ).length;

      // Unread notifications for current user
      const unreadNotifications = await Notification.count({
        where: { userId: req.user.id, isRead: false }
      });

      // Out of range readings today
      const todayDailyLogs = await DailyLog.findAll({
        where: { date: today },
        include: [{ model: DailyLogEntry, as: 'entries' }]
      });
      const outOfRangeToday = todayDailyLogs.reduce((acc, log) => {
        return acc + log.entries.filter(e => e.isOutOfRange).length;
      }, 0);

      res.json({
        success: true,
        data: {
          systems: {
            total: totalSystems,
            active: totalSystems
          },
          users: {
            total: totalUsers
          },
          dailyLogs: {
            today: todayLogs,
            thisWeek: weekLogs
          },
          incidents: {
            open: openIncidents,
            thisWeek: totalIncidentsThisWeek
          },
          inspections: {
            pending: pendingInspections,
            thisWeek: inspectionsThisWeek
          },
          products: {
            lowStock: lowStockProducts
          },
          alerts: {
            unreadNotifications,
            outOfRangeToday
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getRecentActivity(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const recentLogs = await DailyLog.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      const recentInspections = await Inspection.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      const recentIncidents = await Incident.findAll({
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      // Combine and sort by date
      const activities = [
        ...recentLogs.map(l => ({
          type: 'dailyLog',
          id: l.id,
          title: `Daily log recorded for ${l.system.name}`,
          user: l.user.name,
          date: l.createdAt,
          system: l.system.name
        })),
        ...recentInspections.map(i => ({
          type: 'inspection',
          id: i.id,
          title: `Inspection ${i.status} for ${i.system.name}`,
          user: i.user.name,
          date: i.createdAt,
          system: i.system.name,
          status: i.status
        })),
        ...recentIncidents.map(i => ({
          type: 'incident',
          id: i.id,
          title: i.title,
          user: i.reporter.name,
          date: i.createdAt,
          system: i.system.name,
          status: i.status,
          priority: i.priority
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      next(error);
    }
  },

  async getAlerts(req, res, next) {
    try {
      const alerts = [];

      // Open incidents
      const openIncidents = await Incident.findAll({
        where: { status: 'open' },
        include: [{ model: System, as: 'system', attributes: ['id', 'name'] }],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 5
      });

      openIncidents.forEach(incident => {
        alerts.push({
          type: 'incident',
          priority: incident.priority,
          title: incident.title,
          message: `Open incident in ${incident.system.name}`,
          referenceId: incident.id,
          createdAt: incident.createdAt
        });
      });

      // Low stock products
      const products = await Product.findAll({ where: { isActive: true } });
      const lowStockProducts = products.filter(p =>
        p.minStockAlert && parseFloat(p.currentStock) <= parseFloat(p.minStockAlert)
      );

      lowStockProducts.forEach(product => {
        alerts.push({
          type: 'stock',
          priority: 'high',
          title: 'Low Stock Alert',
          message: `${product.name}: ${product.currentStock} ${product.unit} remaining`,
          referenceId: product.id,
          createdAt: new Date()
        });
      });

      // Today's out of range readings
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = await DailyLog.findAll({
        where: { date: today },
        include: [
          { model: System, as: 'system', attributes: ['id', 'name'] },
          {
            model: DailyLogEntry,
            as: 'entries',
            where: { isOutOfRange: true },
            required: true,
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      todayLogs.forEach(log => {
        log.entries.forEach(entry => {
          alerts.push({
            type: 'alert',
            priority: 'high',
            title: 'Out of Range Value',
            message: `${entry.monitoringPoint.name} in ${log.system.name}: ${entry.value} ${entry.monitoringPoint.unit}`,
            referenceId: log.id,
            createdAt: entry.createdAt
          });
        });
      });

      // Sort by priority and date
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      res.json({
        success: true,
        data: alerts.slice(0, 10)
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;
