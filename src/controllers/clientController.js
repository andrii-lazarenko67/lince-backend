const { Client, System, DailyLog, Inspection, Incident, Product, UserClient, User } = require('../../db/models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');

const clientController = {
  async getAll(req, res, next) {
    try {
      const { search, isActive, page = 1, limit = 10 } = req.query;

      // Parse pagination params
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const offset = (pageNum - 1) * limitNum;

      // Get clients the user has access to via UserClient table
      const userClients = await UserClient.findAll({
        where: { userId: req.user.id },
        attributes: ['clientId']
      });
      const clientIds = userClients.map(uc => uc.clientId);

      if (!['admin', 'manager'].includes(req.user.role) && clientIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
          }
        });
      }

      // Only true system admins (non-service-provider) bypass client scoping
      const isSystemAdmin = ['admin', 'manager'].includes(req.user.role) && !req.user.isServiceProvider;
      const where = {
        ...(isSystemAdmin ? {} : { id: { [Op.in]: clientIds } })
      };

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

      // Use findAndCountAll for pagination
      const { count, rows: clients } = await Client.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        limit: limitNum,
        offset
      });

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        success: true,
        data: clients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      // Verify user has access to this client
      const userClient = await UserClient.findOne({
        where: { userId: req.user.id, clientId: req.params.id }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findOne({
        where: { id: req.params.id },
        include: [
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
      const { name, address, contact, phone, email, brandColor } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.nameRequired'
        });
      }

      const client = await Client.create({
        ownerId: req.user.id,
        name,
        address,
        contact,
        phone,
        email,
        brandColor
      });

      // Create UserClient association for the creating user with admin access
      await UserClient.create({
        userId: req.user.id,
        clientId: client.id,
        accessLevel: 'admin'
      });

      // Auto-assign all system managers/admins (non-service-providers) to every new client
      const systemAdmins = await User.findAll({
        where: {
          role: ['admin', 'manager'],
          isServiceProvider: false,
          id: { [Op.ne]: req.user.id }
        }
      });
      for (const admin of systemAdmins) {
        await UserClient.findOrCreate({
          where: { userId: admin.id, clientId: client.id },
          defaults: { accessLevel: 'admin' }
        });
      }
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
      // Verify user has admin or edit access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: { [Op.in]: ['admin', 'edit'] }
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      const { name, address, contact, phone, email, isActive, brandColor } = req.body;

      await client.update({
        name: name !== undefined ? name : client.name,
        address: address !== undefined ? address : client.address,
        contact: contact !== undefined ? contact : client.contact,
        phone: phone !== undefined ? phone : client.phone,
        email: email !== undefined ? email : client.email,
        isActive: isActive !== undefined ? isActive : client.isActive,
        brandColor: brandColor !== undefined ? brandColor : client.brandColor
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
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findByPk(req.params.id);

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
      // Verify user has access to this client
      const userClient = await UserClient.findOne({
        where: { userId: req.user.id, clientId: req.params.id }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      const [systemsCount, dailyLogsCount, inspectionsCount, incidentsCount, productsCount] = await Promise.all([
        System.count({ where: { clientId: client.id, parentId: null } }),
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
  },

  // Get all users with access to a client
  async getUsers(req, res, next) {
    try {
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const clientUsers = await UserClient.findAll({
        where: { clientId: req.params.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'avatar', 'isActive']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: clientUsers
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a user to a client
  async addUser(req, res, next) {
    try {
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const { userId, accessLevel } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.userIdRequired'
        });
      }

      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          messageKey: 'users.errors.notFound'
        });
      }

      // Check if user already has access
      const existingAccess = await UserClient.findOne({
        where: { userId, clientId: req.params.id }
      });

      if (existingAccess) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.userAlreadyHasAccess'
        });
      }

      // User limit check — skip for service providers
      if (!req.user.isServiceProvider) {
        const clientRecord = await Client.findByPk(req.params.id, {
          attributes: ['usersUsed', 'usersLimit']
        });
        if (clientRecord && clientRecord.usersLimit > 0 && clientRecord.usersUsed >= clientRecord.usersLimit) {
          return res.status(403).json({
            success: false,
            messageKey: 'users.errors.limitReached'
          });
        }
      }

      const newUserClient = await UserClient.create({
        userId,
        clientId: req.params.id,
        accessLevel: accessLevel || 'view'
      });

      // Increment usersUsed counter
      if (!req.user.isServiceProvider) {
        await Client.increment('usersUsed', { by: 1, where: { id: req.params.id } });
      }

      // Fetch with user details
      const createdUserClient = await UserClient.findByPk(newUserClient.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'avatar', 'isActive']
        }]
      });

      res.status(201).json({
        success: true,
        data: createdUserClient,
        messageKey: 'settings.clients.userAdded'
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user access level
  async updateUserAccess(req, res, next) {
    try {
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const { accessLevel } = req.body;
      const targetUserId = req.params.userId;

      if (!['view', 'edit', 'admin'].includes(accessLevel)) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.invalidAccessLevel'
        });
      }

      const targetUserClient = await UserClient.findOne({
        where: { userId: targetUserId, clientId: req.params.id }
      });

      if (!targetUserClient) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.userAccessNotFound'
        });
      }

      await targetUserClient.update({ accessLevel });

      // Fetch with user details
      const updatedUserClient = await UserClient.findByPk(targetUserClient.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'avatar', 'isActive']
        }]
      });

      res.json({
        success: true,
        data: updatedUserClient,
        messageKey: 'settings.clients.userAccessUpdated'
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove user access from client
  async removeUser(req, res, next) {
    try {
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const targetUserId = req.params.userId;

      // Prevent removing self if they are the only admin
      if (parseInt(targetUserId) === req.user.id) {
        const adminCount = await UserClient.count({
          where: { clientId: req.params.id, accessLevel: 'admin' }
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            messageKey: 'settings.clients.errors.cannotRemoveLastAdmin'
          });
        }
      }

      const targetUserClient = await UserClient.findOne({
        where: { userId: targetUserId, clientId: req.params.id }
      });

      if (!targetUserClient) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.userAccessNotFound'
        });
      }

      await targetUserClient.destroy();

      res.json({
        success: true,
        messageKey: 'settings.clients.userRemoved'
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload client logo
  async uploadLogo(req, res, next) {
    try {
      // Verify user has admin or edit access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: { [Op.in]: ['admin', 'edit'] }
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'settings.clients.errors.noFileUploaded'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'lince/client-logos',
            public_id: `client-${client.id}-${Date.now()}`,
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
      if (client.logo) {
        try {
          const publicId = client.logo.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // Ignore errors deleting old logo
        }
      }

      // Update client with new logo URL
      await client.update({ logo: uploadResult.secure_url });

      res.json({
        success: true,
        data: { logo: uploadResult.secure_url },
        messageKey: 'settings.clients.logoUploaded'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete client logo
  async deleteLogo(req, res, next) {
    try {
      // Verify user has admin or edit access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: { [Op.in]: ['admin', 'edit'] }
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          messageKey: 'settings.clients.errors.notFound'
        });
      }

      // Delete from Cloudinary if exists
      if (client.logo) {
        try {
          const publicId = client.logo.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // Ignore errors deleting logo
        }
      }

      await client.update({ logo: null });

      res.json({
        success: true,
        messageKey: 'settings.clients.logoDeleted'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get available users to add to client (users in same organization)
  async getAvailableUsers(req, res, next) {
    try {
      // Verify user has admin access to this client
      const userClient = await UserClient.findOne({
        where: {
          userId: req.user.id,
          clientId: req.params.id,
          accessLevel: 'admin'
        }
      });

      if (!userClient && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          messageKey: 'errors.noClientAccess'
        });
      }

      // Get users who don't already have access to this client
      const existingUserIds = await UserClient.findAll({
        where: { clientId: req.params.id },
        attributes: ['userId']
      });
      const excludeIds = existingUserIds.map(uc => uc.userId);

      // Tenant scoping: only show users who already share a client with this admin
      const myClientRows = await UserClient.findAll({
        where: { userId: req.user.id },
        attributes: ['clientId']
      });
      const myClientIds = myClientRows.map(uc => uc.clientId);
      let tenantUserIds = [req.user.id];
      if (myClientIds.length > 0) {
        const sharedRows = await UserClient.findAll({
          where: { clientId: { [Op.in]: myClientIds } },
          attributes: ['userId']
        });
        tenantUserIds = [...new Set(sharedRows.map(r => r.userId))];
      }

      const availableUsers = await User.findAll({
        where: {
          id: { [Op.in]: tenantUserIds, [Op.notIn]: excludeIds },
          isActive: true
        },
        attributes: ['id', 'name', 'email', 'role', 'avatar'],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: availableUsers
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = clientController;
