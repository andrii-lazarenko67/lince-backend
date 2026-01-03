const { ReportTemplate, User } = require('../../db/models');

const reportTemplateController = {
  async getAll(req, res, next) {
    try {
      const templates = await ReportTemplate.findAll({
        where: { userId: req.user.id, isActive: true },
        order: [['isDefault', 'DESC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
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
      const { name, description, config, isDefault } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          messageKey: 'reports.templates.errors.nameRequired'
        });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await ReportTemplate.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
      }

      const template = await ReportTemplate.create({
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        config: config || { modules: [], settings: {} },
        isDefault: isDefault || false
      });

      res.status(201).json({
        success: true,
        data: template,
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

      const { name, description, config, isDefault } = req.body;

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
        config: config !== undefined ? config : template.config,
        isDefault: isDefault !== undefined ? isDefault : template.isDefault
      });

      res.json({
        success: true,
        data: template,
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

  async setDefault(req, res, next) {
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

      // Unset all other defaults
      await ReportTemplate.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );

      // Set this one as default
      await template.update({ isDefault: true });

      res.json({
        success: true,
        data: template,
        messageKey: 'reports.templates.setAsDefault'
      });
    } catch (error) {
      next(error);
    }
  },

  async getDefault(req, res, next) {
    try {
      const template = await ReportTemplate.findOne({
        where: { userId: req.user.id, isDefault: true, isActive: true }
      });

      res.json({
        success: true,
        data: template || null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportTemplateController;
