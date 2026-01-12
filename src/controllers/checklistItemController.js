const { ChecklistItem, System, UserClient } = require('../../db/models');

const checklistItemController = {
  async getAll(req, res, next) {
    try {
      const { systemId, isActive } = req.query;

      // If systemId provided, verify it belongs to client
      if (systemId && req.clientId) {
        const system = await System.findOne({
          where: { id: systemId, clientId: req.clientId }
        });
        if (!system) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.notFound'
          });
        }
      }

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

      // Build where clause for system lookup
      const where = { id: systemId };
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      // Verify system exists and belongs to client (if clientId is set)
      const system = await System.findOne({ where });

      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
        });
      }

      // For service providers without clientId, verify they have access to this system's client
      if (req.user.isServiceProvider && !req.clientId) {
        const userClient = await UserClient.findOne({
          where: {
            userId: req.user.id,
            clientId: system.clientId
          }
        });

        if (!userClient) {
          return res.status(403).json({
            success: false,
            messageKey: 'errors.noClientAccess'
          });
        }
      }

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
          messageKey: 'checklistItems.errors.notFound'
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

      const checklistItem = await ChecklistItem.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!checklistItem) {
        return res.status(404).json({
          success: false,
          messageKey: 'checklistItems.errors.notFound'
        });
      }

      // Verify system belongs to client
      if (req.clientId && checklistItem.system.clientId !== req.clientId) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
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
      const checklistItem = await ChecklistItem.findByPk(req.params.id, {
        include: [{ model: System, as: 'system' }]
      });

      if (!checklistItem) {
        return res.status(404).json({
          success: false,
          messageKey: 'checklistItems.errors.notFound'
        });
      }

      // Verify system belongs to client
      if (req.clientId && checklistItem.system.clientId !== req.clientId) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      await checklistItem.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'checklistItems.success.deactivated'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = checklistItemController;
