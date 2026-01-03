const { Client, Organization, System, DailyLog, Inspection, Incident, Product } = require('../../db/models');
const { Op } = require('sequelize');

const clientController = {
  async getAll(req, res, next) {
    try {
      const { search, isActive } = req.query;

      const where = {};

      // Filter by user's organization if they have one
      if (req.user.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      } else {
        where.isActive = true;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { contact: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const clients = await Client.findAll({
        where,
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'isServiceProvider'],
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: clients
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const where = { id: req.params.id };

      // Ensure user can only access clients from their organization
      if (req.user.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      const client = await Client.findOne({
        where,
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'isServiceProvider'],
            required: false
          },
          {
            model: System,
            as: 'systems',
            attributes: ['id', 'name', 'status'],
            required: false
          }
        ]
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, address, contact, phone, email } = req.body;

      if (!req.user.organizationId) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.noOrganization'
        });
      }

      const client = await Client.create({
        organizationId: req.user.organizationId,
        name,
        address,
        contact,
        phone,
        email
      });

      res.status(201).json({
        success: true,
        data: client,
        messageKey: 'settings.clients.created'
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const where = { id: req.params.id };

      if (req.user.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      const client = await Client.findOne({ where });

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      const { name, address, contact, phone, email, isActive } = req.body;

      await client.update({
        name: name !== undefined ? name : client.name,
        address: address !== undefined ? address : client.address,
        contact: contact !== undefined ? contact : client.contact,
        phone: phone !== undefined ? phone : client.phone,
        email: email !== undefined ? email : client.email,
        isActive: isActive !== undefined ? isActive : client.isActive
      });

      res.json({
        success: true,
        data: client,
        messageKey: 'settings.clients.updated'
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const where = { id: req.params.id };

      if (req.user.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      const client = await Client.findOne({ where });

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      // Soft delete
      await client.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'settings.clients.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const where = { id: req.params.id };

      if (req.user.organizationId) {
        where.organizationId = req.user.organizationId;
      }

      const client = await Client.findOne({ where });

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      const [systemsCount, dailyLogsCount, inspectionsCount, incidentsCount, productsCount] = await Promise.all([
        System.count({ where: { clientId: client.id } }),
        DailyLog.count({ where: { clientId: client.id } }),
        Inspection.count({ where: { clientId: client.id } }),
        Incident.count({ where: { clientId: client.id } }),
        Product.count({ where: { clientId: client.id, isActive: true } })
      ]);

      res.json({
        success: true,
        data: {
          systems: systemsCount,
          dailyLogs: dailyLogsCount,
          inspections: inspectionsCount,
          incidents: incidentsCount,
          products: productsCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = clientController;
