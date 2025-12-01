const jwt = require('jsonwebtoken');
const { User } = require('../../db/models');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const user = await User.findOne({ where: { email } });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      await user.update({ lastLogin: new Date() });

      const token = generateToken(user.id);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async register(req, res, next) {
    try {
      const { name, email, password, role, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'technician',
        phone
      });

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const user = await User.findByPk(req.user.id);
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, email, phone } = req.body;
      const userId = req.user.id;

      // Check if email is being changed and if it's already in use
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use'
          });
        }
      }

      // Build update object with only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      const user = await User.findByPk(userId);
      await user.update(updateData);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
