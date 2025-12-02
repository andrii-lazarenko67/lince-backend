const { Document, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');

const libraryController = {
  async getAll(req, res, next) {
    try {
      const { category, systemId, search } = req.query;

      const where = { isActive: true };

      if (category) where.category = category;
      if (systemId) where.systemId = systemId;
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { fileName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const documents = await Document.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id, {
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, category, systemId } = req.body;
      const uploadedBy = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required'
        });
      }

      // Upload file to Google Cloud Storage
      const result = await uploadService.uploadDocument(
        req.file.buffer,
        'documents',
        req.file.originalname
      );

      const document = await Document.create({
        title,
        description,
        category,
        systemId: systemId || null,
        fileName: req.file.originalname,
        fileUrl: result.secure_url,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        publicId: result.public_id,
        uploadedBy
      });

      const createdDocument = await Document.findByPk(document.id, {
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdDocument
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { title, description, category, systemId } = req.body;

      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      await document.update({
        title: title || document.title,
        description: description !== undefined ? description : document.description,
        category: category || document.category,
        systemId: systemId !== undefined ? systemId : document.systemId
      });

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete from Google Cloud Storage
      if (document.publicId) {
        await uploadService.deleteDocument(document.publicId);
      }

      await document.update({ isActive: false });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = libraryController;
