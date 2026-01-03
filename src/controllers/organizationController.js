const { Organization, User, Client } = require('../../db/models');
const { Op } = require('sequelize');

const organizationController = {
  async getAll(req, res, next) {
    try {
      const { search, isActive } = req.query;

      const where = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }

      const organizations = await Organization.findAll({
        where,
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'name', 'email', 'role'],
            required: false
          },
          {
            model: Client,
            as: 'clients',
            attributes: ['id', 'name'],
            where: { isActive: true },
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: organizations
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const organization = await Organization.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'name', 'email', 'role', 'isActive'],
            required: false
          },
          {
            model: Client,
            as: 'clients',
            where: { isActive: true },
            required: false
          }
        ]
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.organizations.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, isServiceProvider } = req.body;

      const organization = await Organization.create({
        name,
        isServiceProvider: isServiceProvider || false
      });

      res.status(201).json({
        success: true,
        data: organization,
        messageKey: 'settings.organizations.created'
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const organization = await Organization.findByPk(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.organizations.errors.notFound'
        });
      }

      const { name, isServiceProvider, isActive } = req.body;

      await organization.update({
        name: name !== undefined ? name : organization.name,
        isServiceProvider: isServiceProvider !== undefined ? isServiceProvider : organization.isServiceProvider,
        isActive: isActive !== undefined ? isActive : organization.isActive
      });

      res.json({
        success: true,
        data: organization,
        messageKey: 'settings.organizations.updated'
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const organization = await Organization.findByPk(req.params.id);

      if (!organization) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.organizations.errors.notFound'
        });
      }

      // Soft delete - set isActive to false
      await organization.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'settings.organizations.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrent(req, res, next) {
    try {
      if (!req.user.organizationId) {
        return res.json({
          success: true,
          data: null
        });
      }

      const organization = await Organization.findByPk(req.user.organizationId, {
        include: [
          {
            model: Client,
            as: 'clients',
            where: { isActive: true },
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = organizationController;
