const { Inspection, InspectionItem, InspectionPhoto, ChecklistItem, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');

const inspectionController = {
  async getAll(req, res, next) {
    try {
      const { systemId, userId, status, startDate, endDate } = req.query;

      const where = {};

      if (systemId) where.systemId = systemId;
      if (userId) where.userId = userId;
      if (status) where.status = status;
      if (startDate && endDate) {
        where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const inspections = await Inspection.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC']]
      });

      res.json({
        success: true,
        data: inspections
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const inspection = await Inspection.findByPk(req.params.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ]
      });

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      res.json({
        success: true,
        data: inspection
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { systemId, date, conclusion, items } = req.body;
      const userId = req.user.id;

      const inspection = await Inspection.create({
        userId,
        systemId,
        date: date || new Date(),
        status: 'pending',
        conclusion
      });

      // Create inspection items
      if (items) {
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        for (const item of parsedItems) {
          await InspectionItem.create({
            inspectionId: inspection.id,
            checklistItemId: item.checklistItemId,
            status: item.status,
            comment: item.comment
          });
        }
      }

      // Upload photos if provided
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await uploadService.uploadImage(file.buffer, 'inspections');
          await InspectionPhoto.create({
            inspectionId: inspection.id,
            url: result.secure_url,
            publicId: result.public_id,
            caption: ''
          });
        }
      }

      const createdInspection = await Inspection.findByPk(inspection.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdInspection
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { conclusion, status, items } = req.body;

      const inspection = await Inspection.findByPk(req.params.id);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      await inspection.update({
        conclusion: conclusion !== undefined ? conclusion : inspection.conclusion,
        status: status || inspection.status
      });

      // Update items if provided
      if (items) {
        await InspectionItem.destroy({ where: { inspectionId: inspection.id } });

        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        for (const item of parsedItems) {
          await InspectionItem.create({
            inspectionId: inspection.id,
            checklistItemId: item.checklistItemId,
            status: item.status,
            comment: item.comment
          });
        }
      }

      const updatedInspection = await Inspection.findByPk(inspection.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ]
      });

      res.json({
        success: true,
        data: updatedInspection
      });
    } catch (error) {
      next(error);
    }
  },

  async approve(req, res, next) {
    try {
      const { managerNotes } = req.body;

      const inspection = await Inspection.findByPk(req.params.id);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      await inspection.update({
        status: 'approved',
        managerNotes
      });

      res.json({
        success: true,
        data: inspection
      });
    } catch (error) {
      next(error);
    }
  },

  async addPhotos(req, res, next) {
    try {
      const inspection = await Inspection.findByPk(req.params.id);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await uploadService.uploadImage(file.buffer, 'inspections');
          await InspectionPhoto.create({
            inspectionId: inspection.id,
            url: result.secure_url,
            publicId: result.public_id,
            caption: ''
          });
        }
      }

      const updatedInspection = await Inspection.findByPk(inspection.id, {
        include: [{ model: InspectionPhoto, as: 'photos' }]
      });

      res.json({
        success: true,
        data: updatedInspection
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const inspection = await Inspection.findByPk(req.params.id, {
        include: [{ model: InspectionPhoto, as: 'photos' }]
      });

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      // Delete photos from cloudinary
      for (const photo of inspection.photos) {
        if (photo.publicId) {
          await uploadService.deleteImage(photo.publicId);
        }
      }

      await InspectionPhoto.destroy({ where: { inspectionId: inspection.id } });
      await InspectionItem.destroy({ where: { inspectionId: inspection.id } });
      await inspection.destroy();

      res.json({
        success: true,
        message: 'Inspection deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = inspectionController;
