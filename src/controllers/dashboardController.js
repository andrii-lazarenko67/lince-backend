const { System, DailyLog, DailyLogEntry, Inspection, Incident, Product, NotificationRecipient, User, MonitoringPoint, UserClient } = require('../../db/models');
const { Op } = require('sequelize');

/**
 * Helper function to build clientId filter for dashboard queries
 */
async function getClientFilter(req) {
  if (req.clientId) {
    // Specific client selected
    return req.clientId;
  } else if (req.user && req.user.isServiceProvider) {
    // No client selected but service provider - get all their clients
    const userClients = await UserClient.findAll({
      where: { userId: req.user.id },
      attributes: ['clientId']
    });
    const clientIds = userClients.map(uc => uc.clientId);
    if (clientIds.length > 0) {
      return { [Op.in]: clientIds };
    } else {
      return -1; // No clients - return non-existent ID
    }
  }
  return req.clientId; // End customer case
}

const dashboardController = {
  async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get client filter
      const clientFilter = await getClientFilter(req);

      // Get counts filtered by clientId
      const totalSystems = await System.count({ where: { status: 'active', clientId: clientFilter } });
      const totalUsers = await User.count({ where: { isActive: true } });

      const todayLogs = await DailyLog.count({ where: { date: today, clientId: clientFilter } });
      const weekLogs = await DailyLog.count({
        where: { date: { [Op.gte]: weekAgo.toISOString().split('T')[0] }, clientId: clientFilter }
      });

      const openIncidents = await Incident.count({ where: { status: 'open', clientId: clientFilter } });
      const totalIncidentsThisWeek = await Incident.count({
        where: { createdAt: { [Op.gte]: weekAgo }, clientId: clientFilter }
      });

      const pendingInspections = await Inspection.count({ where: { status: 'pending', clientId: clientFilter } });
      const inspectionsThisWeek = await Inspection.count({
        where: { date: { [Op.gte]: weekAgo }, clientId: clientFilter }
      });

      // Low stock products filtered by clientId
      const productWhere = { isActive: true };
      if (req.clientId) {
        // Specific client - show shared + client-specific products
        productWhere[Op.or] = [
          { clientId: null },
          { clientId: clientFilter }
        ];
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected - show shared + all their clients' products
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          productWhere[Op.or] = [
            { clientId: null },
            { clientId: { [Op.in]: clientIds } }
          ];
        } else {
          productWhere.clientId = null; // Only shared products
        }
      }
      const products = await Product.findAll({ where: productWhere });
      const lowStockProducts = products.filter(p =>
        p.minStockAlert && parseFloat(p.currentStock) <= parseFloat(p.minStockAlert)
      ).length;

      // Unread notifications for current user
      const unreadNotifications = await NotificationRecipient.count({
        where: { userId: req.user.id, isRead: false }
      });

      // Out of range readings today filtered by clientId
      const todayDailyLogs = await DailyLog.findAll({
        where: { date: today, clientId: clientFilter },
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

      // Get client filter
      const clientFilter = await getClientFilter(req);

      const recentLogs = await DailyLog.findAll({
        where: { clientId: clientFilter },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      const recentInspections = await Inspection.findAll({
        where: { clientId: clientFilter },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      const recentIncidents = await Incident.findAll({
        where: { clientId: clientFilter },
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
          titleKey: 'dashboard.activity.dailyLogRecorded',
          titleParams: { system: l.system.name },
          user: l.user.name,
          date: l.createdAt,
          system: l.system.name
        })),
        ...recentInspections.map(i => ({
          type: 'inspection',
          id: i.id,
          titleKey: 'dashboard.activity.inspectionStatus',
          titleParams: { status: i.status, system: i.system.name },
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

      // Get client filter
      const clientFilter = await getClientFilter(req);

      // Open incidents filtered by clientId
      const openIncidents = await Incident.findAll({
        where: { status: 'open', clientId: clientFilter },
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
          titleKey: 'dashboard.alerts.openIncident',
          titleParams: { system: incident.system.name },
          referenceId: incident.id,
          createdAt: incident.createdAt
        });
      });

      // Low stock products filtered by clientId
      const productWhere = { isActive: true };
      if (req.clientId) {
        // Specific client - show shared + client-specific products
        productWhere[Op.or] = [
          { clientId: null },
          { clientId: clientFilter }
        ];
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected - show shared + all their clients' products
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          productWhere[Op.or] = [
            { clientId: null },
            { clientId: { [Op.in]: clientIds } }
          ];
        } else {
          productWhere.clientId = null; // Only shared products
        }
      }
      const products = await Product.findAll({ where: productWhere });
      const lowStockProducts = products.filter(p =>
        p.minStockAlert && parseFloat(p.currentStock) <= parseFloat(p.minStockAlert)
      );

      lowStockProducts.forEach(product => {
        alerts.push({
          type: 'stock',
          priority: 'high',
          titleKey: 'dashboard.alerts.lowStock',
          messageKey: 'dashboard.alerts.lowStockMessage',
          messageParams: { name: product.name, stock: product.currentStock, unit: product.unit },
          referenceId: product.id,
          createdAt: new Date()
        });
      });

      // Today's out of range readings filtered by clientId
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = await DailyLog.findAll({
        where: { date: today, clientId: clientFilter },
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
            titleKey: 'dashboard.alerts.outOfRange',
            messageKey: 'dashboard.alerts.outOfRangeMessage',
            messageParams: { point: entry.monitoringPoint.name, system: log.system.name, value: entry.value, unit: entry.monitoringPoint.unit },
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
