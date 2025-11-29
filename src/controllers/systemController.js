const { System, MonitoringPoint, ChecklistItem } = require('../../db/models');
const { Op } = require('sequelize');

const systemController = {
  async getAll(req, res, next) {
    try {
      const { status, type, search } = req.query;

      const where = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const systems = await System.findAll({
        where,
        include: [
          {
            model: MonitoringPoint,
            as: 'monitoringPoints',
            where: { isActive: true },
            required: false
          },
          {
            model: ChecklistItem,
            as: 'checklistItems',
            where: { isActive: true },
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: systems
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const system = await System.findByPk(req.params.id, {
        include: [
          {
            model: MonitoringPoint,
            as: 'monitoringPoints',
            where: { isActive: true },
            required: false
          },
          {
            model: ChecklistItem,
            as: 'checklistItems',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']]
          }
        ]
      });

      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      res.json({
        success: true,
        data: system
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, type, location, description, status } = req.body;

      const system = await System.create({
        name,
        type,
        location,
        description,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        data: system
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, type, location, description, status } = req.body;

      const system = await System.findByPk(req.params.id);

      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      await system.update({
        name: name || system.name,
        type: type || system.type,
        location: location !== undefined ? location : system.location,
        description: description !== undefined ? description : system.description,
        status: status || system.status
      });

      res.json({
        success: true,
        data: system
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const system = await System.findByPk(req.params.id);

      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      await system.update({ status: 'inactive' });

      res.json({
        success: true,
        message: 'System deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = systemController;
