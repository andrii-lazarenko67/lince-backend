const { Document, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');

const libraryController = {
  async getAll(req, res, next) {
    try {
      const { category, systemId, search } = req.query;

      const where = { isActive: true };

      // Client filtering - required for data isolation
      if (req.clientId) {
        where.clientId = req.clientId;
      }

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
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const document = await Document.findOne({
        where,
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          messageKey: 'library.errors.notFound'
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
      // Require clientId for creating documents
      if (!req.clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      const { title, description, category, systemId } = req.body;
      const uploadedBy = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'library.errors.fileRequired'
        });
      }

      // Upload file to Cloudinary
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
        uploadedBy,
        clientId: req.clientId
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
      const { title, description, category, systemId, fileName } = req.body;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const document = await Document.findOne({ where });

      if (!document) {
        return res.status(404).json({
          success: false,
          messageKey: 'library.errors.notFound'
        });
      }

      // Validate systemId belongs to client if being updated
      if (systemId !== undefined && systemId !== null && systemId !== document.systemId && req.clientId) {
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

      await document.update({
        title: title || document.title,
        description: description !== undefined ? description : document.description,
        category: category || document.category,
        systemId: systemId !== undefined ? systemId : document.systemId,
        fileName: fileName || document.fileName
      });

      const updatedDocument = await Document.findByPk(document.id, {
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedDocument
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadNewVersion(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'library.errors.noFile'
        });
      }

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const document = await Document.findOne({ where });

      if (!document) {
        return res.status(404).json({
          success: false,
          messageKey: 'library.errors.notFound'
        });
      }

      // Delete old version from Cloudinary
      if (document.publicId) {
        await uploadService.deleteDocument(document.publicId);
      }

      // Upload new version
      const result = await uploadService.uploadDocument(req.file.buffer, req.file.originalname);

      // Update document with new version
      await document.update({
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        updatedAt: new Date()
      });

      const updatedDocument = await Document.findByPk(document.id, {
        include: [
          { model: System, as: 'system' },
          { model: User, as: 'uploader', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedDocument
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

      const document = await Document.findOne({ where });

      if (!document) {
        return res.status(404).json({
          success: false,
          messageKey: 'library.errors.notFound'
        });
      }

      // Delete from Cloudinary
      if (document.publicId) {
        await uploadService.deleteDocument(document.publicId);
      }

      await document.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'library.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = libraryController;
