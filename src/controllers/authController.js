const jwt = require('jsonwebtoken');
const { User, Organization } = require('../../db/models');
const uploadService = require('../services/uploadService');

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
          messageKey: 'login.errors.emailPasswordRequired'
        });
      }

      const user = await User.findOne({
        where: { email },
        include: [{
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'isServiceProvider']
        }]
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          messageKey: 'login.errors.invalidCredentials'
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          messageKey: 'login.errors.invalidCredentials'
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
          messageKey: 'login.errors.requiredFields'
        });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          messageKey: 'login.errors.emailExists'
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
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'isServiceProvider']
        }]
      });

      res.json({
        success: true,
        data: user.toJSON()
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
          messageKey: 'profile.errors.passwordRequired'
        });
      }

      const user = await User.findByPk(req.user.id);
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          messageKey: 'profile.errors.currentPasswordIncorrect'
        });
      }

      await user.update({ password: newPassword });

      res.json({
        success: true,
        messageKey: 'profile.success.passwordChanged'
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
            messageKey: 'profile.errors.emailInUse'
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
  },

  async uploadAvatar(req, res, next) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          messageKey: 'profile.errors.avatarRequired'
        });
      }

      const user = await User.findByPk(userId);

      // Delete old avatar from Cloudinary if exists
      if (user.avatar) {
        // Extract public ID from avatar URL
        const urlParts = user.avatar.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `lince/avatars/${filename.split('.')[0]}`;
        try {
          await uploadService.deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Continue even if deletion fails
        }
      }

      // Upload new avatar to Cloudinary
      const result = await uploadService.uploadImage(req.file.buffer, 'avatars');

      // Update user with new avatar URL
      await user.update({ avatar: result.secure_url });

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
