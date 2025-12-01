const { MonitoringPoint, System } = require('../../db/models');

const monitoringPointController = {
  async getAll(req, res, next) {
    try {
      const { systemId } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;

      const monitoringPoints = await MonitoringPoint.findAll({
        where,
        include: [{ model: System, as: 'system' }],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: monitoringPoints
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySystem(req, res, next) {
    try {
      const { systemId } = req.params;

      const monitoringPoints = await MonitoringPoint.findAll({
        where: { systemId },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: monitoringPoints
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const monitoringPoint = await MonitoringPoint.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          message: 'Monitoring point not found'
        });
      }

      res.json({
        success: true,
        data: monitoringPoint
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { systemId, name, parameter, unit, minValue, maxValue, alertEnabled } = req.body;

      const system = await System.findByPk(systemId);
      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      const monitoringPoint = await MonitoringPoint.create({
        systemId,
        name,
        parameter,
        unit,
        minValue,
        maxValue,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : true
      });

      res.status(201).json({
        success: true,
        data: monitoringPoint
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, parameter, unit, minValue, maxValue, alertEnabled } = req.body;

      const monitoringPoint = await MonitoringPoint.findByPk(req.params.id);

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          message: 'Monitoring point not found'
        });
      }

      await monitoringPoint.update({
        name: name || monitoringPoint.name,
        parameter: parameter || monitoringPoint.parameter,
        unit: unit || monitoringPoint.unit,
        minValue: minValue !== undefined ? minValue : monitoringPoint.minValue,
        maxValue: maxValue !== undefined ? maxValue : monitoringPoint.maxValue,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : monitoringPoint.alertEnabled
      });

      res.json({
        success: true,
        data: monitoringPoint
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const monitoringPoint = await MonitoringPoint.findByPk(req.params.id);

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          message: 'Monitoring point not found'
        });
      }

      await monitoringPoint.destroy();

      res.json({
        success: true,
        message: 'Monitoring point deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = monitoringPointController;
