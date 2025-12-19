const { User } = require('../../db/models');
const { Op } = require('sequelize');

const userController = {
  async getAll(req, res, next) {
    try {
      const { role, isActive, search } = req.query;

      const where = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const users = await User.findAll({
        where,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: users
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
  }
};

module.exports = userController;
