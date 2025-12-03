const { Incident, IncidentPhoto, IncidentComment, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');
const notificationService = require('../services/notificationService');

const incidentController = {
  async getAll(req, res, next) {
    try {
      const { systemId, userId, status, priority, assignedTo } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;
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
      const incident = await Incident.findByPk(req.params.id, {
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
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
          message: 'Incident not found'
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
      const { systemId, title, description, priority, sendNotification } = req.body;
      const userId = req.user.id;

      const incident = await Incident.create({
        userId,
        systemId,
        title,
        description,
        priority: priority || 'medium',
        status: 'open'
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
          title: 'New Incident Reported',
          message: `${title} - ${system.name}`,
          priority: priority || 'medium',
          referenceType: 'Incident',
          referenceId: incident.id,
          createdById: userId
        });
      }

      const createdIncident = await Incident.findByPk(incident.id, {
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
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

      const incident = await Incident.findByPk(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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

      const incident = await Incident.findByPk(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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
          title: 'Incident Assigned to You',
          message: incident.title,
          priority: incident.priority,
          referenceType: 'Incident',
          referenceId: incident.id,
          createdById: req.user.id
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

      const incident = await Incident.findByPk(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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

      const incident = await Incident.findByPk(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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
      const incident = await Incident.findByPk(req.params.id);

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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
      const incident = await Incident.findByPk(req.params.id, {
        include: [{ model: IncidentPhoto, as: 'photos' }]
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Incident not found'
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
        message: 'Incident deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = incidentController;
