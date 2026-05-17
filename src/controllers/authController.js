const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const { User, Client, UserClient } = require('../../db/models');
const uploadService = require('../services/uploadService');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifyHcaptcha = (token) => {
  return new Promise((resolve, reject) => {
    const secret = process.env.HCAPTCHA_SECRET;
    const postData = `response=${encodeURIComponent(token)}&secret=${encodeURIComponent(secret)}`;
    const options = {
      hostname: 'hcaptcha.com',
      path: '/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success === true);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
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

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          messageKey: 'login.errors.emailNotVerified',
          email: user.email
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

      const userClients = await UserClient.findAll({
        where: { userId: user.id },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'name']
        }]
      });

      let redirectTo = 'dashboard';
      let selectedClient = null;

      if (user.isServiceProvider) {
        if (userClients.length === 0) {
          redirectTo = 'add-client';
        } else {
          selectedClient = userClients[0].client;
        }
      } else {
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
      const { name, email, password, isServiceProvider, companyName, phone, captchaToken } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.requiredFields'
        });
      }

      if (!companyName) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.companyNameRequired'
        });
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.phoneRequired'
        });
      }

      const e164Regex = /^\+[1-9]\d{7,14}$/;
      if (!e164Regex.test(phone)) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.phoneInvalid'
        });
      }

      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.phoneExists'
        });
      }

      // Verify hCaptcha token
      if (!captchaToken) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.captchaRequired'
        });
      }
      const captchaValid = await verifyHcaptcha(captchaToken);
      if (!captchaValid) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.captchaRequired'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          messageKey: 'signup.errors.emailExists'
        });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        phone,
        isServiceProvider: !!isServiceProvider,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry
      });

      let client = null;
      if (!isServiceProvider) {
        const trialDays = parseInt(process.env.TRIAL_DAYS || '14', 10);
        const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        client = await Client.create({
          ownerId: user.id,
          name: companyName,
          contact: name,
          email: email,
          phone: phone,
          subscriptionStatus: 'trialing',
          trialEndsAt
        });
        await UserClient.create({
          userId: user.id,
          clientId: client.id,
          accessLevel: 'admin'
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
      if (emailService.isConfigured()) {
        try {
          await emailService.sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError.message);
        }
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Email verify URL:', verifyUrl);
      }

      res.status(201).json({
        success: true,
        data: {
          requiresVerification: true,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);

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

      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            messageKey: 'profile.errors.emailInUse'
          });
        }
      }

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

      const result = await uploadService.uploadImage(req.file.buffer, 'avatars');
      await user.update({ avatar: result.secure_url });

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, messageKey: 'login.forgotPassword.errors.emailRequired' });
      }
      const user = await User.findOne({ where: { email } });
      if (!user || !user.isActive) {
        return res.json({ success: true, messageKey: 'login.forgotPassword.emailSent' });
      }
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password-reset' },
        process.env.JWT_SECRET + user.password,
        { expiresIn: '1h' }
      );
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = frontendUrl + '/reset-password?token=' + resetToken;
      if (emailService.isConfigured()) {
        try {
          await emailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError.message);
        }
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Password reset URL:', resetUrl);
      }
      res.json({ success: true, messageKey: 'login.forgotPassword.emailSent' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, messageKey: 'login.resetPassword.errors.required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, messageKey: 'login.resetPassword.errors.passwordTooShort' });
      }
      let decoded;
      try { decoded = jwt.decode(token); } catch { decoded = null; }
      if (!decoded || decoded.type !== 'password-reset') {
        return res.status(400).json({ success: false, messageKey: 'login.resetPassword.errors.invalidToken' });
      }
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(400).json({ success: false, messageKey: 'login.resetPassword.errors.invalidToken' });
      }
      try {
        jwt.verify(token, process.env.JWT_SECRET + user.password);
      } catch {
        return res.status(400).json({ success: false, messageKey: 'login.resetPassword.errors.tokenExpired' });
      }
      await user.update({ password });
      res.json({ success: true, messageKey: 'login.resetPassword.success' });
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ success: false, messageKey: 'verify.errors.tokenRequired' });
      }

      const { Op } = require('sequelize');
      const user = await User.findOne({
        where: {
          verificationToken: token,
          verificationTokenExpiry: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ success: false, messageKey: 'verify.errors.invalidOrExpired' });
      }

      await user.update({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });

      const jwtToken = generateToken(user.id);

      const userClients = await UserClient.findAll({
        where: { userId: user.id },
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }]
      });

      let selectedClient = null;
      let redirectTo = 'dashboard';

      if (user.isServiceProvider) {
        redirectTo = userClients.length === 0 ? 'add-client' : 'dashboard';
        if (userClients.length > 0) selectedClient = userClients[0].client;
      } else {
        if (userClients.length > 0) selectedClient = userClients[0].client;
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token: jwtToken,
          client: selectedClient ? { id: selectedClient.id, name: selectedClient.name } : null,
          redirectTo
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, messageKey: 'verify.errors.emailRequired' });
      }

      const user = await User.findOne({ where: { email } });

      if (!user || user.emailVerified) {
        return res.json({ success: true, messageKey: 'verify.resent' });
      }

      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await user.update({ verificationToken, verificationTokenExpiry });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      if (emailService.isConfigured()) {
        try {
          await emailService.sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
        } catch (e) {
          console.error('Failed to resend verification email:', e.message);
        }
      }

      res.json({ success: true, messageKey: 'verify.resent' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
