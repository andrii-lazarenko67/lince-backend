const { ReportTemplate, User, Client } = require('../../db/models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');

// Default template configuration based on CLIENT_REQUIREMENTS_FINAL.md
const DEFAULT_TEMPLATE_CONFIG = {
  blocks: [
    { type: 'identification', enabled: true, order: 1 },
    { type: 'scope', enabled: true, order: 2 },
    { type: 'systems', enabled: true, order: 3, includePhotos: true },
    { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: false, showFieldOverview: true, showFieldDetailed: false, showLaboratoryOverview: true, showLaboratoryDetailed: false },
    { type: 'inspections', enabled: true, order: 5, includePhotos: true },
    { type: 'occurrences', enabled: true, order: 6, includeTimeline: true },
    { type: 'conclusion', enabled: true, order: 7 },
    { type: 'signature', enabled: true, order: 8 },
    { type: 'attachments', enabled: false, order: 9 }
  ],
  branding: {
    showLogo: true,
    logoPosition: 'left',
    primaryColor: '#1976d2',
    showHeader: true,
    headerText: 'Technical Report',
    showFooter: true,
    footerText: 'Page {page} of {pages}'
  }
};

const reportTemplateController = {
  async getAll(req, res, next) {
    try {
      const clientId = req.clientId;

      // Build where clause: user's templates for this client + global templates
      const whereClause = {
        isActive: true,
        [Op.or]: [
          { userId: req.user.id, clientId: clientId },
          { userId: req.user.id, clientId: null },
          { isGlobal: true }
        ]
      };

      const templates = await ReportTemplate.findAll({
        where: whereClause,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ],
        order: [['isDefault', 'DESC'], ['isGlobal', 'DESC'], ['name', 'ASC']]
      });

      // Filter templates by client's system types
      if (clientId) {
        const { System } = require('../../db/models');

        // Get unique system types for this client
        const systems = await System.findAll({
          where: { clientId },
          attributes: ['systemTypeId'],
          group: ['systemTypeId']
        });

        const clientSystemTypeIds = systems.map(s => s.systemTypeId);

        // Filter templates:
        // - Include if systemTypeIds is null/empty (general template)
        // - Include if any systemTypeId matches client's system types
        const filteredTemplates = templates.filter(template => {
          if (!template.systemTypeIds || template.systemTypeIds.length === 0) {
            return true; // General template - show for all clients
          }

          // Check if any template systemTypeId exists in client's system types
          return template.systemTypeIds.some(typeId =>
            clientSystemTypeIds.includes(typeId)
          );
        });

        res.json({
          success: true,
          data: filteredTemplates
        });
      } else {
        // No client selected - return all templates
        res.json({
          success: true,
          data: templates
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: {
          id: req.params.id,
          isActive: true,
          [Op.or]: [
            { userId: req.user.id },
            { isGlobal: true }
          ]
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description, type, config, isDefault, clientId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          messageKey: 'reports.templates.errors.nameRequired'
        });
      }

      // If setting as default, unset other defaults for this user
      if (isDefault) {
        await ReportTemplate.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
      }

      // Use default config if not provided
      const templateConfig = config || DEFAULT_TEMPLATE_CONFIG;

      const template = await ReportTemplate.create({
        userId: req.user.id,
        clientId: clientId || req.clientId || null,
        name: name.trim(),
        description: description?.trim() || null,
        type: type || 'both',
        config: templateConfig,
        isDefault: isDefault || false,
        isGlobal: false
      });

      // Fetch with associations
      const createdTemplate = await ReportTemplate.findByPk(template.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdTemplate,
        messageKey: 'reports.templates.created'
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: req.params.id, userId: req.user.id, isActive: true }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      // Cannot edit global templates unless you're the creator
      if (template.isGlobal && template.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          messageKey: 'reports.templates.errors.cannotEditGlobal'
        });
      }

      const { name, description, type, config, isDefault } = req.body;

      // If setting as default, unset other defaults
      if (isDefault && !template.isDefault) {
        await ReportTemplate.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
      }

      await template.update({
        name: name !== undefined ? name.trim() : template.name,
        description: description !== undefined ? (description?.trim() || null) : template.description,
        type: type !== undefined ? type : template.type,
        config: config !== undefined ? config : template.config,
        isDefault: isDefault !== undefined ? isDefault : template.isDefault
      });

      // Fetch with associations
      const updatedTemplate = await ReportTemplate.findByPk(template.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedTemplate,
        messageKey: 'reports.templates.updated'
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: req.params.id, userId: req.user.id, isActive: true }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      // Cannot delete global templates unless you're the creator
      if (template.isGlobal && template.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          messageKey: 'reports.templates.errors.cannotDeleteGlobal'
        });
      }

      // Soft delete
      await template.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'reports.templates.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  async duplicate(req, res, next) {
    try {
      const originalTemplate = await ReportTemplate.findOne({
        where: {
          id: req.params.id,
          isActive: true,
          [Op.or]: [
            { userId: req.user.id },
            { isGlobal: true }
          ]
        }
      });

      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      const { name } = req.body;
      const newName = name?.trim() || `${originalTemplate.name} (Copy)`;

      const duplicatedTemplate = await ReportTemplate.create({
        userId: req.user.id,
        clientId: req.clientId || originalTemplate.clientId,
        name: newName,
        description: originalTemplate.description,
        type: originalTemplate.type,
        config: originalTemplate.config,
        isDefault: false,
        isGlobal: false
      });

      // Fetch with associations
      const createdTemplate = await ReportTemplate.findByPk(duplicatedTemplate.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdTemplate,
        messageKey: 'reports.templates.duplicated'
      });
    } catch (error) {
      next(error);
    }
  },

  async setDefault(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: {
          id: req.params.id,
          isActive: true,
          [Op.or]: [
            { userId: req.user.id },
            { isGlobal: true }
          ]
        }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      // Unset all other defaults for this user
      await ReportTemplate.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );

      // Set this one as default
      await template.update({ isDefault: true });

      // Fetch with associations
      const updatedTemplate = await ReportTemplate.findByPk(template.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedTemplate,
        messageKey: 'reports.templates.setAsDefault'
      });
    } catch (error) {
      next(error);
    }
  },

  async getDefault(req, res, next) {
    try {
      let template = await ReportTemplate.findOne({
        where: { userId: req.user.id, isDefault: true, isActive: true },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      // If no default, try to find a global default
      if (!template) {
        template = await ReportTemplate.findOne({
          where: { isGlobal: true, isDefault: true, isActive: true },
          include: [
            { model: User, as: 'user', attributes: ['id', 'name'] },
            { model: Client, as: 'client', attributes: ['id', 'name'] }
          ]
        });
      }

      res.json({
        success: true,
        data: template || null
      });
    } catch (error) {
      next(error);
    }
  },

  // Get the default template config for creating new templates
  async getDefaultConfig(req, res, next) {
    try {
      res.json({
        success: true,
        data: DEFAULT_TEMPLATE_CONFIG
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload template logo
  async uploadLogo(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: req.params.id, userId: req.user.id, isActive: true }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      // Cannot edit global templates unless you're the creator
      if (template.isGlobal && template.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          messageKey: 'reports.templates.errors.cannotEditGlobal'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'reports.templates.errors.noFile'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'lince/template-logos',
            public_id: `template-${template.id}-${Date.now()}`,
            resource_type: 'image',
            transformation: [
              { width: 400, height: 400, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Delete old logo from Cloudinary if exists
      if (template.logo) {
        try {
          const publicId = template.logo.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // Ignore errors deleting old logo
        }
      }

      // Update template with new logo URL
      await template.update({ logo: uploadResult.secure_url });

      // Fetch with associations
      const updatedTemplate = await ReportTemplate.findByPk(template.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedTemplate,
        messageKey: 'reports.templates.logoUploaded'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete template logo
  async deleteLogo(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: { id: req.params.id, userId: req.user.id, isActive: true }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          messageKey: 'reports.templates.errors.notFound'
        });
      }

      // Cannot edit global templates unless you're the creator
      if (template.isGlobal && template.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          messageKey: 'reports.templates.errors.cannotEditGlobal'
        });
      }

      // Delete from Cloudinary if exists
      if (template.logo) {
        try {
          const publicId = template.logo.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // Ignore errors deleting logo
        }
      }

      await template.update({ logo: null });

      // Fetch with associations
      const updatedTemplate = await ReportTemplate.findByPk(template.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      });

      res.json({
        success: true,
        data: updatedTemplate,
        messageKey: 'reports.templates.logoDeleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportTemplateController;
