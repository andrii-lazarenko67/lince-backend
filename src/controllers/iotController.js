'use strict';

const { IoTDevice, IoTReading, MonitoringPoint, System, Parameter, Unit, DailyLog, DailyLogEntry } = require('../../db/models');
const { Op } = require('sequelize');

const monitoringPointInclude = {
  model: MonitoringPoint,
  as: 'monitoringPoint',
  include: [
    { model: Parameter, as: 'parameterObj', attributes: ['name'] },
    { model: Unit, as: 'unitObj', attributes: ['abbreviation'] }
  ]
};

const iotController = {
  /**
   * List all IoT devices for the current client
   * GET /api/iot/devices
   */
  async getDevices(req, res, next) {
    try {
      const clientId = req.clientId;
      const devices = await IoTDevice.findAll({
        where: { clientId },
        include: [
          { model: System, as: 'system', attributes: ['id', 'name'] },
          monitoringPointInclude
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: devices });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register a new IoT device
   * POST /api/iot/devices
   */
  async createDevice(req, res, next) {
    try {
      const { name, description, systemId, monitoringPointId } = req.body;
      const clientId = req.clientId;

      if (!name || !systemId || !monitoringPointId) {
        return res.status(400).json({ success: false, messageKey: 'iot.errors.requiredFields' });
      }

      const system = await System.findOne({ where: { id: systemId, clientId } });
      if (!system) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.systemNotFound' });
      }

      const mp = await MonitoringPoint.findOne({ where: { id: monitoringPointId, systemId } });
      if (!mp) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.monitoringPointNotFound' });
      }

      const device = await IoTDevice.create({ name, description, systemId, monitoringPointId, clientId });

      const deviceWithDetails = await IoTDevice.findByPk(device.id, {
        include: [
          { model: System, as: 'system', attributes: ['id', 'name'] },
          monitoringPointInclude
        ]
      });

      res.status(201).json({ success: true, data: deviceWithDetails });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an IoT device
   * DELETE /api/iot/devices/:id
   */
  async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;
      const clientId = req.clientId;

      const device = await IoTDevice.findOne({ where: { id, clientId } });
      if (!device) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.deviceNotFound' });
      }

      await device.destroy();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle device active/inactive status
   * PATCH /api/iot/devices/:id/status
   */
  async updateDeviceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const clientId = req.clientId;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, messageKey: 'iot.errors.invalidStatus' });
      }

      const device = await IoTDevice.findOne({ where: { id, clientId } });
      if (!device) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.deviceNotFound' });
      }

      await device.update({ status });
      res.json({ success: true, data: device });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Ingest a sensor reading — PUBLIC endpoint, uses X-Device-Token header
   * POST /api/iot/ingest
   */
  async ingest(req, res, next) {
    try {
      const token = req.headers['x-device-token'];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Device token required' });
      }

      const device = await IoTDevice.findOne({
        where: { token, status: 'active' },
        include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
      });

      if (!device) {
        return res.status(401).json({ success: false, message: 'Invalid or inactive device token' });
      }

      const { value, recordedAt } = req.body;
      if (value === undefined || value === null) {
        return res.status(400).json({ success: false, message: 'Value is required' });
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return res.status(400).json({ success: false, message: 'Value must be a number' });
      }

      const mp = device.monitoringPoint;
      let isOutOfRange = false;
      if (mp) {
        if (mp.minValue !== null && mp.minValue !== undefined && numValue < parseFloat(mp.minValue)) isOutOfRange = true;
        if (mp.maxValue !== null && mp.maxValue !== undefined && numValue > parseFloat(mp.maxValue)) isOutOfRange = true;
      }

      const reading = await IoTReading.create({
        deviceId: device.id,
        clientId: device.clientId,
        systemId: device.systemId,
        monitoringPointId: device.monitoringPointId,
        value: numValue,
        isOutOfRange,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      });

      await device.update({ lastSeen: new Date(), lastValue: numValue, isOutOfRange });

      res.json({ success: true, data: { id: reading.id, isOutOfRange } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get readings for a device (live chart data)
   * GET /api/iot/readings?deviceId=X&hours=24
   */
  async getReadings(req, res, next) {
    try {
      const { deviceId, hours = 24, limit = 500 } = req.query;
      const clientId = req.clientId;

      if (!deviceId) {
        return res.status(400).json({ success: false, messageKey: 'iot.errors.deviceIdRequired' });
      }

      const device = await IoTDevice.findOne({ where: { id: deviceId, clientId } });
      if (!device) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.deviceNotFound' });
      }

      const since = new Date();
      since.setHours(since.getHours() - parseInt(hours));

      const readings = await IoTReading.findAll({
        where: {
          deviceId,
          recordedAt: { [Op.gte]: since }
        },
        order: [['recordedAt', 'ASC']],
        limit: parseInt(limit)
      });

      res.json({ success: true, data: readings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Import daily average of IoT readings into a DailyLogEntry
   * POST /api/iot/import-to-log
   */
  async importToLog(req, res, next) {
    try {
      const { deviceId, date } = req.body;
      const clientId = req.clientId;
      const userId = req.user.id;

      if (!deviceId || !date) {
        return res.status(400).json({ success: false, messageKey: 'iot.errors.requiredFields' });
      }

      const device = await IoTDevice.findOne({
        where: { id: deviceId, clientId },
        include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
      });

      if (!device) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.deviceNotFound' });
      }

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const readings = await IoTReading.findAll({
        where: { deviceId, recordedAt: { [Op.between]: [dayStart, dayEnd] } }
      });

      if (readings.length === 0) {
        return res.status(404).json({ success: false, messageKey: 'iot.errors.noReadingsForDate' });
      }

      const sum = readings.reduce((acc, r) => acc + parseFloat(r.value), 0);
      const avgValue = Math.round((sum / readings.length) * 100) / 100;

      const mp = device.monitoringPoint;
      let isOutOfRange = false;
      if (mp) {
        if (mp.minValue !== null && mp.minValue !== undefined && avgValue < parseFloat(mp.minValue)) isOutOfRange = true;
        if (mp.maxValue !== null && mp.maxValue !== undefined && avgValue > parseFloat(mp.maxValue)) isOutOfRange = true;
      }

      const [dailyLog] = await DailyLog.findOrCreate({
        where: { systemId: device.systemId, clientId, date, recordType: 'field' },
        defaults: {
          userId,
          systemId: device.systemId,
          clientId,
          date,
          recordType: 'field',
          timeMode: 'auto',
          notes: `IoT import — ${readings.length} readings (daily avg)`
        }
      });

      const [entry, created] = await DailyLogEntry.findOrCreate({
        where: { dailyLogId: dailyLog.id, monitoringPointId: device.monitoringPointId },
        defaults: {
          dailyLogId: dailyLog.id,
          monitoringPointId: device.monitoringPointId,
          value: avgValue,
          isOutOfRange,
          notes: `IoT avg (${readings.length} readings)`
        }
      });

      if (!created) {
        await entry.update({ value: avgValue, isOutOfRange, notes: `IoT avg (${readings.length} readings)` });
      }

      res.json({
        success: true,
        data: {
          dailyLogId: dailyLog.id,
          value: avgValue,
          isOutOfRange,
          readingsCount: readings.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = iotController;
