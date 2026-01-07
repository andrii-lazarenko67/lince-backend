const { Incident, IncidentPhoto, IncidentComment, System, User, UserClient } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');
const notificationService = require('../services/notificationService');

const incidentController = {
  async getAll(req, res, next) {
    try {
      const { systemId, stageId, userId, status, priority, assignedTo } = req.query;

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
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assignedTo) where.assignedTo = assignedTo;

      const incidents = await Incident.findAll({
        where,
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: incidents
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

      const incident = await Incident.findOne({
        where,
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { systemId, stageId, title, description, priority, sendNotification } = req.body;
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

      const incident = await Incident.create({
        userId,
        systemId,
        stageId: stageId || null,
        title,
        description,
        priority: priority || 'medium',
        status: 'open',
        clientId: req.clientId
      });

      // Upload photos if provided
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await uploadService.uploadImage(file.buffer, 'incidents');
          await IncidentPhoto.create({
            incidentId: incident.id,
            url: result.secure_url,
            publicId: result.public_id,
            caption: ''
          });
        }
      }

      // Send notification to managers
      if (sendNotification === 'true' || sendNotification === true) {
        const system = await System.findByPk(systemId);

        await notificationService.notifyManagers({
          type: 'incident',
          titleKey: 'notifications.messages.incident.title',
          messageKey: 'notifications.messages.incident.message',
          messageParams: { title: title, system: system.name },
          priority: priority || 'medium',
          referenceType: 'Incident',
          referenceId: incident.id,
          createdById: userId,
          clientId: req.clientId
        });
      }

      const createdIncident = await Incident.findByPk(incident.id, {
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          { model: System, as: 'stage' },
          { model: IncidentPhoto, as: 'photos' }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdIncident
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { title, description, priority, status } = req.body;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const incident = await Incident.findOne({ where });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      await incident.update({
        title: title || incident.title,
        description: description || incident.description,
        priority: priority || incident.priority,
        status: status || incident.status
      });

      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      next(error);
    }
  },

  async assign(req, res, next) {
    try {
      const { assignedTo } = req.body;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const incident = await Incident.findOne({ where });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      await incident.update({
        assignedTo,
        status: 'in_progress'
      });

      // Notify assigned user
      if (assignedTo) {
        await notificationService.notifyUser({
          type: 'incident',
          titleKey: 'notifications.messages.incidentAssigned.title',
          messageKey: 'notifications.messages.incidentAssigned.message',
          priority: incident.priority,
          referenceType: 'Incident',
          referenceId: incident.id,
          createdById: req.user.id,
          clientId: req.clientId
        }, assignedTo);
      }

      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      next(error);
    }
  },

  async resolve(req, res, next) {
    try {
      const { resolution } = req.body;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const incident = await Incident.findOne({ where });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      await incident.update({
        status: 'resolved',
        resolution,
        resolvedAt: new Date()
      });

      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req, res, next) {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const incident = await Incident.findOne({ where });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      const comment = await IncidentComment.create({
        incidentId: incident.id,
        userId,
        content
      });

      const createdComment = await IncidentComment.findByPk(comment.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
      });

      res.status(201).json({
        success: true,
        data: createdComment
      });
    } catch (error) {
      next(error);
    }
  },

  async addPhotos(req, res, next) {
    try {
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const incident = await Incident.findOne({ where });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await uploadService.uploadImage(file.buffer, 'incidents');
          await IncidentPhoto.create({
            incidentId: incident.id,
            url: result.secure_url,
            publicId: result.public_id,
            caption: ''
          });
        }
      }

      const updatedIncident = await Incident.findByPk(incident.id, {
        include: [{ model: IncidentPhoto, as: 'photos' }]
      });

      res.json({
        success: true,
        data: updatedIncident
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

      const incident = await Incident.findOne({
        where,
        include: [{ model: IncidentPhoto, as: 'photos' }]
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          messageKey: 'incidents.errors.notFound'
        });
      }

      // Delete photos from cloudinary
      for (const photo of incident.photos) {
        if (photo.publicId) {
          await uploadService.deleteImage(photo.publicId);
        }
      }

      await IncidentPhoto.destroy({ where: { incidentId: incident.id } });
      await IncidentComment.destroy({ where: { incidentId: incident.id } });
      await incident.destroy();

      res.json({
        success: true,
        messageKey: 'incidents.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = incidentController;
