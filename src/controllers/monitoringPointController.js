const { MonitoringPoint, System, Parameter, Unit } = require('../../db/models');
const { Op } = require('sequelize');

const monitoringPointController = {
  async getAll(req, res, next) {
    try {
      const { systemId } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;

      const monitoringPoints = await MonitoringPoint.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          { model: Parameter, as: 'parameterObj' },
          { model: Unit, as: 'unitObj' }
        ],
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
        include: [
          { model: Parameter, as: 'parameterObj' },
          { model: Unit, as: 'unitObj' }
        ],
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
        include: [
          { model: System, as: 'system' },
          { model: Parameter, as: 'parameterObj' },
          { model: Unit, as: 'unitObj' }
        ]
      });

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          messageKey: 'monitoringPoints.errors.notFound'
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
      const { systemId, name, parameterId, unitId, minValue, maxValue, alertEnabled } = req.body;

      // Validate system exists and belongs to client
      const where = { id: systemId };
      if (req.clientId) {
        where.clientId = req.clientId;
      }
      const system = await System.findOne({ where });
      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
        });
      }

      // Validate parameter exists
      const parameter = await Parameter.findByPk(parameterId);
      if (!parameter) {
        return res.status(400).json({
          success: false,
          messageKey: 'monitoringPoints.errors.parameterNotFound'
        });
      }

      // Validate unit exists (if provided - unit is optional)
      if (unitId !== null && unitId !== undefined) {
        const unit = await Unit.findByPk(unitId);
        if (!unit) {
          return res.status(400).json({
            success: false,
            messageKey: 'monitoringPoints.errors.unitNotFound'
          });
        }
      }

      const monitoringPoint = await MonitoringPoint.create({
        systemId,
        name,
        parameterId,
        unitId,
        minValue,
        maxValue,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : true
      });

      // Fetch with associations for response
      const fullMonitoringPoint = await MonitoringPoint.findByPk(monitoringPoint.id, {
        include: [
          { model: Parameter, as: 'parameterObj' },
          { model: Unit, as: 'unitObj' }
        ]
      });

      res.status(201).json({
        success: true,
        data: fullMonitoringPoint
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, parameterId, unitId, minValue, maxValue, alertEnabled } = req.body;

      const monitoringPoint = await MonitoringPoint.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          messageKey: 'monitoringPoints.errors.notFound'
        });
      }

      // Verify system belongs to client
      if (req.clientId && monitoringPoint.system.clientId !== req.clientId) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      // Validate parameter if provided
      if (parameterId) {
        const parameter = await Parameter.findByPk(parameterId);
        if (!parameter) {
          return res.status(400).json({
            success: false,
            messageKey: 'monitoringPoints.errors.parameterNotFound'
          });
        }
      }

      // Validate unit if provided (unit is optional - can be null)
      if (unitId !== null && unitId !== undefined) {
        const unit = await Unit.findByPk(unitId);
        if (!unit) {
          return res.status(400).json({
            success: false,
            messageKey: 'monitoringPoints.errors.unitNotFound'
          });
        }
      }

      await monitoringPoint.update({
        name: name || monitoringPoint.name,
        parameterId: parameterId || monitoringPoint.parameterId,
        unitId: unitId !== undefined ? unitId : monitoringPoint.unitId,
        minValue: minValue !== undefined ? minValue : monitoringPoint.minValue,
        maxValue: maxValue !== undefined ? maxValue : monitoringPoint.maxValue,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : monitoringPoint.alertEnabled
      });

      // Fetch with associations for response
      const fullMonitoringPoint = await MonitoringPoint.findByPk(monitoringPoint.id, {
        include: [
          { model: Parameter, as: 'parameterObj' },
          { model: Unit, as: 'unitObj' }
        ]
      });

      res.json({
        success: true,
        data: fullMonitoringPoint
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const monitoringPoint = await MonitoringPoint.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!monitoringPoint) {
        return res.status(404).json({
          success: false,
          messageKey: 'monitoringPoints.errors.notFound'
        });
      }

      // Verify system belongs to client
      if (req.clientId && monitoringPoint.system.clientId !== req.clientId) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      await monitoringPoint.destroy();

      res.json({
        success: true,
        messageKey: 'monitoringPoints.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get monitoring points formatted for chart configuration
  async getForChartConfig(req, res, next) {
    try {
      const clientId = req.clientId;
      const { systemIds } = req.query;

      const where = {};

      if (systemIds) {
        const ids = systemIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          where.systemId = { [Op.in]: ids };
        }
      }

      // Build system where clause for client filtering
      const systemWhere = {};
      if (clientId) {
        systemWhere.clientId = clientId;
      }

      // Get monitoring points with their parameters and units
      const monitoringPoints = await MonitoringPoint.findAll({
        where,
        include: [
          {
            model: System,
            as: 'system',
            attributes: ['id', 'name', 'clientId'],
            where: Object.keys(systemWhere).length > 0 ? systemWhere : undefined
          },
          { model: Parameter, as: 'parameterObj', attributes: ['id', 'name'] },
          { model: Unit, as: 'unitObj', attributes: ['id', 'abbreviation'] }
        ],
        order: [['name', 'ASC']]
      });

      // Format response for chart config UI
      const formatted = monitoringPoints.map(mp => ({
        id: mp.id,
        name: mp.name,
        systemId: mp.systemId,
        systemName: mp.system?.name || '',
        parameterName: mp.parameterObj?.name || mp.name,
        unit: mp.unitObj?.abbreviation || '',
        minValue: mp.minValue !== null ? parseFloat(mp.minValue) : null,
        maxValue: mp.maxValue !== null ? parseFloat(mp.maxValue) : null,
        hasSpecLimits: mp.minValue !== null || mp.maxValue !== null
      }));

      res.json({
        success: true,
        data: formatted
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = monitoringPointController;
