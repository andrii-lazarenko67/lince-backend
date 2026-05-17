const { User, UserClient, Client } = require('../../db/models');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');

const userController = {
  async getAll(req, res, next) {
    try {
      const { role, isActive, search, page = 1, limit = 10 } = req.query;

      // Parse pagination params
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const offset = (pageNum - 1) * limitNum;

      const where = { isActive: true };

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Tenant scoping: only show users who share a client with the current admin
      const { UserClient } = require('../../db/models');
      const scopedClientId = req.clientId;
      if (scopedClientId) {
        const sharedUserRows = await UserClient.findAll({
          where: { clientId: scopedClientId },
          attributes: ['userId']
        });
        const sharedUserIds = [...new Set(sharedUserRows.map(r => r.userId))];
        where.id = { [Op.in]: sharedUserIds };
      } else {
        where.id = req.user.id;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        limit: limitNum,
        offset
      });

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        success: true,
        data: users,
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
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          messageKey: 'users.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, email, password, role, phone } = req.body;

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          messageKey: 'users.errors.emailExists'
        });
      }

      const user = await User.create({
        name,
        email,
        password: password || 'password123',
        role: role || 'technician',
        phone
      });
      const adminClientRows = await UserClient.findAll({
        where: { userId: req.user.id },
        attributes: ['clientId']
      });
      console.log('[createUser] admin', req.user.id, 'clients:', adminClientRows.map(r => r.clientId));
      if (adminClientRows.length > 0) {
        await UserClient.bulkCreate(
          adminClientRows.map(uc => ({ userId: user.id, clientId: uc.clientId })),
          { ignoreDuplicates: true }
        );
        console.log('[createUser] linked user', user.id, 'to clients:', adminClientRows.map(r => r.clientId));
        // Increment usersUsed counter for each linked client
        for (const uc of adminClientRows) {
          await Client.increment('usersUsed', { where: { id: uc.clientId } });
        }
      }
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, email, role, phone, isActive } = req.body;

      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          messageKey: 'users.errors.notFound'
        });
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            messageKey: 'users.errors.emailInUse'
          });
        }
      }

      await user.update({
        name: name || user.name,
        email: email || user.email,
        role: role || user.role,
        phone: phone !== undefined ? phone : user.phone,
        isActive: isActive !== undefined ? isActive : user.isActive
      });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          messageKey: 'users.errors.notFound'
        });
      }

      await user.update({ isActive: false });
      const userClientRows = await UserClient.findAll({ where: { userId: user.id }, attributes: ['clientId'] });
      for (const uc of userClientRows) {
        await Client.decrement('usersUsed', { where: { id: uc.clientId, usersUsed: { [Op.gt]: 0 } } });
      }

      res.json({
        success: true,
        messageKey: 'users.success.deactivated'
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;

      await req.user.update({
        name: name || req.user.name,
        phone: phone !== undefined ? phone : req.user.phone
      });

      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      const userId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'users.errors.avatarRequired'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          messageKey: 'users.errors.notFound'
        });
      }

      // Delete old avatar from Cloudinary if exists
      if (user.avatar) {
        const urlParts = user.avatar.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `lince/avatars/${filename.split('.')[0]}`;
        try {
          await uploadService.deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
        }
      }

      // Upload new avatar to Cloudinary
      const result = await uploadService.uploadImage(req.file.buffer, 'avatars');

      // Update user with new avatar URL
      await user.update({ avatar: result.secure_url });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
