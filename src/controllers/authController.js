const jwt = require('jsonwebtoken');
const { User, Client, UserClient } = require('../../db/models');
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
        where: { email }
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

      // Get user's clients for context
      const userClients = await UserClient.findAll({
        where: { userId: user.id },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'name']
        }]
      });

      // Determine redirect based on user type
      let redirectTo = 'dashboard';
      let selectedClient = null;

      if (user.isServiceProvider) {
        // Service provider: check if they have any clients
        if (userClients.length === 0) {
          redirectTo = 'add-client';
        } else {
          selectedClient = userClients[0].client;
        }
      } else {
        // End customer: should have exactly one client (their company)
        if (userClients.length > 0) {
          selectedClient = userClients[0].client;
        }
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token,
          client: selectedClient,
          redirectTo
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async register(req, res, next) {
    try {
      const { name, email, password, isServiceProvider, companyName, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.requiredFields'
        });
      }

      // For end customers, company name is required
      if (!isServiceProvider && !companyName) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.companyNameRequired'
        });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.emailExists'
        });
      }

      // Create user with admin role (they're the owner of their account)
      const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        phone,
        isServiceProvider: !!isServiceProvider
      });

      const token = generateToken(user.id);
      let client = null;
      let redirectTo = 'dashboard';

      if (!isServiceProvider) {
        // End customer flow: auto-create their company as a client
        client = await Client.create({
          ownerId: user.id,
          name: companyName,
          contact: name,
          email: email,
          phone: phone
        });

        // Link user to their client with admin access
        await UserClient.create({
          userId: user.id,
          clientId: client.id,
          accessLevel: 'admin'
        });
      } else {
        // Service provider flow: redirect to add first client
        redirectTo = 'add-client';
      }

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token,
          client: client ? { id: client.id, name: client.name } : null,
          redirectTo
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);

      // Get user's clients
      const userClients = await UserClient.findAll({
        where: { userId: user.id },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'name']
        }]
      });

      const clients = userClients.map(uc => ({
        id: uc.client.id,
        name: uc.client.name,
        accessLevel: uc.accessLevel
      }));

      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          clients
        }
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
