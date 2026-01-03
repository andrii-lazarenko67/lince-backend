const { System, SystemType, MonitoringPoint, ChecklistItem } = require('../../db/models');
const { Op } = require('sequelize');

const systemController = {
  async getAll(req, res, next) {
    try {
      const { status, systemTypeId, search, parentId } = req.query;

      const where = {};

      // Client filtering for service provider mode
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      if (status) where.status = status;
      if (systemTypeId) where.systemTypeId = systemTypeId;
      if (parentId !== undefined) {
        // Filter by parent: if parentId is 'null' or '', get root systems only
        where.parentId = parentId === 'null' || parentId === '' ? null : parentId;
      }
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
            model: SystemType,
            as: 'systemType',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: MonitoringPoint,
            as: 'monitoringPoints',
            required: false
          },
          {
            model: ChecklistItem,
            as: 'checklistItems',
            where: { isActive: true },
            required: false
          },
          {
            model: System,
            as: 'parent',
            attributes: ['id', 'name', 'systemTypeId'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'systemTypeId', 'status'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
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
      const where = { id: req.params.id };

      // Filter by clientId if provided
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const system = await System.findOne({
        where,
        include: [
          {
            model: SystemType,
            as: 'systemType',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: MonitoringPoint,
            as: 'monitoringPoints',
            required: false
          },
          {
            model: ChecklistItem,
            as: 'checklistItems',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']]
          },
          {
            model: System,
            as: 'parent',
            attributes: ['id', 'name', 'systemTypeId'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'systemTypeId', 'status', 'location'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          }
        ]
      });

      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
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
      const { name, systemTypeId, location, description, status, parentId } = req.body;

      // Require clientId for creating systems
      if (!req.clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      let finalSystemTypeId = systemTypeId;
      let finalLocation = location;
      let finalClientId = req.clientId;

      // If creating a step (has parent), inherit location, systemTypeId, and clientId from parent
      if (parentId) {
        const parent = await System.findByPk(parentId);
        if (!parent) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.parentNotFound'
          });
        }

        // Verify parent belongs to the same client
        if (parent.clientId !== req.clientId) {
          return res.status(403).json({
            success: false,
            messageKey: 'errors.noClientAccess'
          });
        }

        // Steps inherit location and systemTypeId from parent
        finalSystemTypeId = parent.systemTypeId;
        finalLocation = parent.location;
        finalClientId = parent.clientId;
      } else {
        // Root systems must have systemTypeId
        if (!systemTypeId) {
          return res.status(400).json({
            success: false,
            messageKey: 'systems.errors.typeRequired'
          });
        }

        const systemType = await SystemType.findByPk(systemTypeId);
        if (!systemType) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.typeNotFound'
          });
        }
      }

      const system = await System.create({
        name,
        systemTypeId: finalSystemTypeId,
        location: finalLocation,
        description,
        status: status || 'active',
        parentId: parentId || null,
        clientId: finalClientId
      });

      // Fetch with associations for response
      const createdSystem = await System.findByPk(system.id, {
        include: [
          {
            model: SystemType,
            as: 'systemType',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: System,
            as: 'parent',
            attributes: ['id', 'name', 'systemTypeId'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'systemTypeId', 'status'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdSystem
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, systemTypeId, location, description, status, parentId } = req.body;

      const where = { id: req.params.id };

      // Filter by clientId if provided
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

      // Validate systemTypeId if provided
      if (systemTypeId !== undefined) {
        const systemType = await SystemType.findByPk(systemTypeId);
        if (!systemType) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.typeNotFound'
          });
        }
      }

      // Validate parent exists if parentId is provided
      if (parentId !== undefined && parentId !== null) {
        // Prevent circular reference (system can't be its own parent)
        if (parseInt(parentId) === parseInt(req.params.id)) {
          return res.status(400).json({
            success: false,
            messageKey: 'systems.errors.cannotBeOwnParent'
          });
        }

        const parent = await System.findByPk(parentId);
        if (!parent) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.parentNotFound'
          });
        }

        // Prevent circular reference (parent can't be a child of this system)
        const checkCircular = async (checkId, targetId) => {
          const checkSystem = await System.findByPk(checkId);
          if (!checkSystem || !checkSystem.parentId) return false;
          if (checkSystem.parentId === targetId) return true;
          return await checkCircular(checkSystem.parentId, targetId);
        };

        const isCircular = await checkCircular(parentId, parseInt(req.params.id));
        if (isCircular) {
          return res.status(400).json({
            success: false,
            messageKey: 'systems.errors.circularReference'
          });
        }
      }

      await system.update({
        name: name || system.name,
        systemTypeId: systemTypeId || system.systemTypeId,
        location: location !== undefined ? location : system.location,
        description: description !== undefined ? description : system.description,
        status: status || system.status,
        parentId: parentId !== undefined ? (parentId || null) : system.parentId
      });

      // Fetch with associations for response
      const updatedSystem = await System.findByPk(system.id, {
        include: [
          {
            model: SystemType,
            as: 'systemType',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: System,
            as: 'parent',
            attributes: ['id', 'name', 'systemTypeId'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          },
          {
            model: System,
            as: 'children',
            attributes: ['id', 'name', 'systemTypeId', 'status'],
            include: [{
              model: SystemType,
              as: 'systemType',
              attributes: ['id', 'name'],
              required: false
            }],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: updatedSystem
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { force } = req.query;
      const forceDelete = force === 'true';

      const where = { id: req.params.id };

      // Filter by clientId if provided
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const system = await System.findOne({
        where,
        include: [
          { model: MonitoringPoint, as: 'monitoringPoints' },
          { model: ChecklistItem, as: 'checklistItems' }
        ]
      });

      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
        });
      }

      // Check if system has children
      const childrenCount = await System.count({ where: { parentId: req.params.id } });
      if (childrenCount > 0) {
        return res.status(400).json({
          success: false,
          messageKey: 'systems.errors.hasSubSystems'
        });
      }

      // Check if system has related records that prevent deletion
      const { DailyLog, Inspection, Incident } = require('../../db/models');

      const dailyLogCount = await DailyLog.count({ where: { systemId: req.params.id } });
      const inspectionCount = await Inspection.count({ where: { systemId: req.params.id } });
      const incidentCount = await Incident.count({ where: { systemId: req.params.id } });

      if (dailyLogCount > 0 || inspectionCount > 0 || incidentCount > 0) {
        if (!forceDelete) {
          // First attempt - warn user about related records
          return res.status(400).json({
            success: false,
            messageKey: 'systems.errors.hasRelatedRecords',
            relatedRecords: {
              dailyLogs: dailyLogCount,
              inspections: inspectionCount,
              incidents: incidentCount
            }
          });
        }

        // Force delete - delete all related records
        if (dailyLogCount > 0) {
          await DailyLog.destroy({ where: { systemId: req.params.id } });
        }
        if (inspectionCount > 0) {
          await Inspection.destroy({ where: { systemId: req.params.id } });
        }
        if (incidentCount > 0) {
          await Incident.destroy({ where: { systemId: req.params.id } });
        }
      }

      // Delete associated monitoring points and checklist items
      if (system.monitoringPoints && system.monitoringPoints.length > 0) {
        await MonitoringPoint.destroy({ where: { systemId: req.params.id } });
      }

      if (system.checklistItems && system.checklistItems.length > 0) {
        await ChecklistItem.destroy({ where: { systemId: req.params.id } });
      }

      // Delete the system
      await system.destroy();

      res.json({
        success: true,
        messageKey: 'systems.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = systemController;
