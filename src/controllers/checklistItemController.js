const { ChecklistItem, System } = require('../../db/models');

const checklistItemController = {
  async getAll(req, res, next) {
    try {
      const { systemId, isActive } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const checklistItems = await ChecklistItem.findAll({
        where,
        include: [{ model: System, as: 'system' }],
        order: [['order', 'ASC']]
      });

      res.json({
        success: true,
        data: checklistItems
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySystem(req, res, next) {
    try {
      const { systemId } = req.params;

      const checklistItems = await ChecklistItem.findAll({
        where: { systemId, isActive: true },
        order: [['order', 'ASC']]
      });

      res.json({
        success: true,
        data: checklistItems
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const checklistItem = await ChecklistItem.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!checklistItem) {
        return res.status(404).json({
          success: false,
          message: 'Checklist item not found'
        });
      }

      res.json({
        success: true,
        data: checklistItem
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { systemId, name, description, isRequired, order } = req.body;

      const system = await System.findByPk(systemId);
      if (!system) {
        return res.status(404).json({
          success: false,
          message: 'System not found'
        });
      }

      const checklistItem = await ChecklistItem.create({
        systemId,
        name,
        description,
        isRequired: isRequired || false,
        order: order || 0
      });

      res.status(201).json({
        success: true,
        data: checklistItem
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, description, isRequired, order, isActive } = req.body;

      const checklistItem = await ChecklistItem.findByPk(req.params.id);

      if (!checklistItem) {
        return res.status(404).json({
          success: false,
          message: 'Checklist item not found'
        });
      }

      await checklistItem.update({
        name: name || checklistItem.name,
        description: description !== undefined ? description : checklistItem.description,
        isRequired: isRequired !== undefined ? isRequired : checklistItem.isRequired,
        order: order !== undefined ? order : checklistItem.order,
        isActive: isActive !== undefined ? isActive : checklistItem.isActive
      });

      res.json({
        success: true,
        data: checklistItem
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const checklistItem = await ChecklistItem.findByPk(req.params.id);

      if (!checklistItem) {
        return res.status(404).json({
          success: false,
          message: 'Checklist item not found'
        });
      }

      await checklistItem.update({ isActive: false });

      res.json({
        success: true,
        message: 'Checklist item deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = checklistItemController;
