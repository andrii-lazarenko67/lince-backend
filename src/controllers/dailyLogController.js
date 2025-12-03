const { DailyLog, DailyLogEntry, MonitoringPoint, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const dailyLogController = {
  async getAll(req, res, next) {
    try {
      const { systemId, userId, startDate, endDate } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;
      if (userId) where.userId = userId;
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        where.date = { [Op.gte]: startDate };
      } else if (endDate) {
        where.date = { [Op.lte]: endDate };
      }

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: dailyLogs
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySystem(req, res, next) {
    try {
      const { systemId } = req.params;
      const { startDate, endDate } = req.query;

      const where = { systemId };

      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      }

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']]
      });

      res.json({
        success: true,
        data: dailyLogs
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const dailyLog = await DailyLog.findByPk(req.params.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          message: 'Daily log not found'
        });
      }

      res.json({
        success: true,
        data: dailyLog
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { systemId, date, notes, entries } = req.body;
      const userId = req.user.id;

      // Check if daily log already exists for this user, system, and date
      const existingLog = await DailyLog.findOne({
        where: { userId, systemId, date }
      });

      if (existingLog) {
        return res.status(400).json({
          success: false,
          message: 'Daily log already exists for this date and system'
        });
      }

      const dailyLog = await DailyLog.create({
        userId,
        systemId,
        date,
        notes
      });

      // Create entries and check for out of range values
      if (entries && entries.length > 0) {
        const outOfRangeAlerts = [];

        for (const entry of entries) {
          const monitoringPoint = await MonitoringPoint.findByPk(entry.monitoringPointId);

          let isOutOfRange = false;
          if (monitoringPoint) {
            const value = parseFloat(entry.value);
            if (monitoringPoint.minValue !== null && value < parseFloat(monitoringPoint.minValue)) {
              isOutOfRange = true;
            }
            if (monitoringPoint.maxValue !== null && value > parseFloat(monitoringPoint.maxValue)) {
              isOutOfRange = true;
            }

            if (isOutOfRange && monitoringPoint.alertEnabled) {
              outOfRangeAlerts.push({
                monitoringPoint,
                value: entry.value
              });
            }
          }

          await DailyLogEntry.create({
            dailyLogId: dailyLog.id,
            monitoringPointId: entry.monitoringPointId,
            value: entry.value,
            isOutOfRange
          });
        }

        // Create notifications for out of range values
        if (outOfRangeAlerts.length > 0) {
          const system = await System.findByPk(systemId);

          for (const alert of outOfRangeAlerts) {
            await notificationService.notifyManagers({
              type: 'alert',
              title: 'Out of Range Value Detected',
              message: `${alert.monitoringPoint.name} in ${system.name} recorded value ${alert.value} (Expected: ${alert.monitoringPoint.minValue}-${alert.monitoringPoint.maxValue})`,
              priority: 'high',
              referenceType: 'DailyLog',
              referenceId: dailyLog.id,
              createdById: userId
            });
          }
        }
      }

      const createdLog = await DailyLog.findByPk(dailyLog.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdLog
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { notes, entries } = req.body;

      const dailyLog = await DailyLog.findByPk(req.params.id);

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          message: 'Daily log not found'
        });
      }

      await dailyLog.update({ notes: notes !== undefined ? notes : dailyLog.notes });

      // Update entries if provided
      if (entries && entries.length > 0) {
        // Delete existing entries
        await DailyLogEntry.destroy({ where: { dailyLogId: dailyLog.id } });

        // Create new entries
        for (const entry of entries) {
          const monitoringPoint = await MonitoringPoint.findByPk(entry.monitoringPointId);

          let isOutOfRange = false;
          if (monitoringPoint) {
            const value = parseFloat(entry.value);
            if (monitoringPoint.minValue !== null && value < parseFloat(monitoringPoint.minValue)) {
              isOutOfRange = true;
            }
            if (monitoringPoint.maxValue !== null && value > parseFloat(monitoringPoint.maxValue)) {
              isOutOfRange = true;
            }
          }

          await DailyLogEntry.create({
            dailyLogId: dailyLog.id,
            monitoringPointId: entry.monitoringPointId,
            value: entry.value,
            isOutOfRange
          });
        }
      }

      const updatedLog = await DailyLog.findByPk(dailyLog.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      res.json({
        success: true,
        data: updatedLog
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const dailyLog = await DailyLog.findByPk(req.params.id);

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          message: 'Daily log not found'
        });
      }

      await DailyLogEntry.destroy({ where: { dailyLogId: dailyLog.id } });
      await dailyLog.destroy();

      res.json({
        success: true,
        message: 'Daily log deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dailyLogController;
