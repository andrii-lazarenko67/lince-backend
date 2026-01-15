const { DailyLog, DailyLogEntry, MonitoringPoint, System, User, Parameter, Unit, UserClient } = require('../../db/models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const dailyLogController = {
  async getAll(req, res, next) {
    try {
      const { systemId, stageId, userId, recordType, startDate, endDate, page = 1, limit = 10 } = req.query;

      // Parse pagination params
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const offset = (pageNum - 1) * limitNum;

      const where = {};

      // Client filtering for service provider mode
      if (req.clientId) {
        // Specific client selected - show only that client's data
        where.clientId = req.clientId;
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected but service provider - show all their clients' data
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          where.clientId = { [Op.in]: clientIds };
        } else {
          where.clientId = -1; // No clients - return empty
        }
      }

      if (systemId) where.systemId = systemId;
      if (stageId) where.stageId = stageId;
      if (userId) where.userId = userId;
      if (recordType) where.recordType = recordType;
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        where.date = { [Op.gte]: startDate };
      } else if (endDate) {
        where.date = { [Op.lte]: endDate };
      }

      const { count, rows: dailyLogs } = await DailyLog.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{
              model: MonitoringPoint,
              as: 'monitoringPoint',
              include: [
                { model: Parameter, as: 'parameterObj' },
                { model: Unit, as: 'unitObj' }
              ]
            }]
          }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        success: true,
        data: dailyLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySystem(req, res, next) {
    try {
      const { systemId } = req.params;
      const { startDate, endDate, recordType, stageId } = req.query;

      const where = { systemId };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      if (stageId) where.stageId = stageId;
      if (recordType) where.recordType = recordType;
      if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      }

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{
              model: MonitoringPoint,
              as: 'monitoringPoint',
              include: [
                { model: Parameter, as: 'parameterObj' },
                { model: Unit, as: 'unitObj' }
              ]
            }]
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
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const dailyLog = await DailyLog.findOne({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{
              model: MonitoringPoint,
              as: 'monitoringPoint',
              include: [
                { model: Parameter, as: 'parameterObj' },
                { model: Unit, as: 'unitObj' }
              ]
            }]
          }
        ]
      });

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          messageKey: 'dailyLogs.errors.notFound'
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
      const {
        systemId,
        stageId,
        recordType,
        date,
        period,
        time,
        timeMode,
        laboratory,
        collectionDate,
        collectionTime,
        collectionTimeMode,
        notes,
        entries,
        sendNotification
      } = req.body;
      const userId = req.user.id;

      // Require clientId
      if (!req.clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      // Validate system belongs to client
      const system = await System.findOne({
        where: { id: systemId, clientId: req.clientId }
      });
      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
        });
      }

      // Validate stage belongs to system if provided
      if (stageId) {
        const stage = await System.findOne({
          where: { id: stageId, parentId: systemId }
        });
        if (!stage) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.notFound'
          });
        }
      }

      // Validate record type specific fields
      if (recordType === 'laboratory' && !laboratory) {
        return res.status(400).json({
          success: false,
          messageKey: 'dailyLogs.errors.laboratoryRequired'
        });
      }

      // Check if daily log already exists for this user, system, date, and record type
      const existingLog = await DailyLog.findOne({
        where: {
          userId,
          systemId,
          stageId: stageId || null,
          date,
          recordType: recordType || 'field'
        }
      });

      if (existingLog) {
        return res.status(400).json({
          success: false,
          messageKey: 'dailyLogs.errors.alreadyExists'
        });
      }

      const dailyLog = await DailyLog.create({
        userId,
        systemId,
        stageId: stageId || null,
        recordType: recordType || 'field',
        date,
        period: period || null,
        time: time || null,
        timeMode: timeMode || 'manual',
        laboratory: laboratory || null,
        collectionDate: collectionDate || null,
        collectionTime: collectionTime || null,
        collectionTimeMode: collectionTimeMode || 'manual',
        notes: notes || null,
        clientId: req.clientId
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
            isOutOfRange,
            notes: entry.notes || null
          });
        }

        // Create notifications for out of range values (only if checkbox is checked)
        if (sendNotification && outOfRangeAlerts.length > 0) {
          const system = await System.findByPk(systemId);

          for (const alert of outOfRangeAlerts) {
            const rangeText = alert.monitoringPoint.minValue !== null && alert.monitoringPoint.maxValue !== null
              ? `Expected: ${alert.monitoringPoint.minValue}-${alert.monitoringPoint.maxValue}`
              : 'Expected range: N/A';

            await notificationService.notifyManagers({
              type: 'alert',
              titleKey: 'notifications.messages.outOfRange.title',
              messageKey: 'notifications.messages.outOfRange.message',
              messageParams: { point: alert.monitoringPoint.name, system: system.name, value: alert.value, range: rangeText },
              priority: 'high',
              referenceType: 'DailyLog',
              referenceId: dailyLog.id,
              createdById: userId,
              clientId: req.clientId
            });
          }
        }
      }

      const createdLog = await DailyLog.findByPk(dailyLog.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{
              model: MonitoringPoint,
              as: 'monitoringPoint',
              include: [
                { model: Parameter, as: 'parameterObj' },
                { model: Unit, as: 'unitObj' }
              ]
            }]
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

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const dailyLog = await DailyLog.findOne({ where });

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          messageKey: 'dailyLogs.errors.notFound'
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
            isOutOfRange,
            notes: entry.notes || null
          });
        }
      }

      const updatedLog = await DailyLog.findByPk(dailyLog.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{
              model: MonitoringPoint,
              as: 'monitoringPoint',
              include: [
                { model: Parameter, as: 'parameterObj' },
                { model: Unit, as: 'unitObj' }
              ]
            }]
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
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const dailyLog = await DailyLog.findOne({ where });

      if (!dailyLog) {
        return res.status(404).json({
          success: false,
          messageKey: 'dailyLogs.errors.notFound'
        });
      }

      await DailyLogEntry.destroy({ where: { dailyLogId: dailyLog.id } });
      await dailyLog.destroy();

      res.json({
        success: true,
        messageKey: 'dailyLogs.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dailyLogController;
