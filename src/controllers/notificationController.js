const { Notification, NotificationRecipient, User, UserClient } = require('../../db/models');
const { Op } = require('sequelize');

const notificationController = {
  // Get all notifications for current user with their read status
  async getAll(req, res, next) {
    try {
      const { isRead, type } = req.query;
      const userId = req.user.id;

      const whereRecipient = { userId };
      if (isRead !== undefined) whereRecipient.isRead = isRead === 'true';

      const whereNotification = {};
      if (type) whereNotification.type = type;

      // Client filtering - show notifications for the selected client
      if (req.clientId) {
        // Specific client selected - show only that client's notifications
        whereNotification.clientId = req.clientId;
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected but service provider - show all their clients' notifications
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          whereNotification.clientId = { [Op.in]: clientIds };
        } else {
          whereNotification.clientId = -1; // No clients - return empty
        }
      }

      const recipients = await NotificationRecipient.findAll({
        where: whereRecipient,
        include: [{
          model: Notification,
          as: 'notification',
          where: whereNotification,
          include: [{
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email']
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      const notifications = recipients.map(r => ({
        id: r.notification.id,
        recipientId: r.id,
        type: r.notification.type,
        title: r.notification.title,
        message: r.notification.message,
        priority: r.notification.priority,
        referenceType: r.notification.referenceType,
        referenceId: r.notification.referenceId,
        createdBy: r.notification.createdBy,
        isRead: r.isRead,
        createdAt: r.notification.createdAt
      }));

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  },

  // Get unread count for current user
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      // Build where clause for notifications
      const whereNotification = {};
      if (req.clientId) {
        // Specific client selected - count only that client's notifications
        whereNotification.clientId = req.clientId;
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected but service provider - count all their clients' notifications
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          whereNotification.clientId = { [Op.in]: clientIds };
        } else {
          whereNotification.clientId = -1; // No clients - return empty
        }
      }

      const count = await NotificationRecipient.count({
        where: { userId, isRead: false },
        include: [{
          model: Notification,
          as: 'notification',
          where: whereNotification
        }]
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark a notification as read for current user
  async markAsRead(req, res, next) {
    try {
      const recipient = await NotificationRecipient.findOne({
        where: { notificationId: req.params.id, userId: req.user.id },
        include: [{
          model: Notification,
          as: 'notification'
        }]
      });

      if (!recipient) {
        return res.status(404).json({
          success: false,
          messageKey: 'notifications.errors.notFound'
        });
      }

      await recipient.update({ isRead: true });

      res.json({
        success: true,
        data: {
          id: recipient.notification.id,
          recipientId: recipient.id,
          type: recipient.notification.type,
          title: recipient.notification.title,
          message: recipient.notification.message,
          priority: recipient.notification.priority,
          referenceType: recipient.notification.referenceType,
          referenceId: recipient.notification.referenceId,
          isRead: true,
          createdAt: recipient.notification.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark all notifications as read for current user
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await NotificationRecipient.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );

      res.json({
        success: true,
        messageKey: 'notifications.success.allMarkedAsRead'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get notification details with all recipients' read status (Manager/Admin only)
  async getNotificationRecipients(req, res, next) {
    try {
      const { role } = req.user;

      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
          success: false,
          messageKey: 'notifications.errors.adminOnly'
        });
      }

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const notification = await Notification.findOne({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: NotificationRecipient,
            as: 'recipients',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role']
            }]
          }
        ]
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          messageKey: 'notifications.errors.notFound'
        });
      }

      const readBy = notification.recipients
        .filter(r => r.isRead)
        .map(r => ({
          userId: r.user.id,
          name: r.user.name,
          email: r.user.email,
          role: r.user.role
        }));

      const unreadBy = notification.recipients
        .filter(r => !r.isRead)
        .map(r => ({
          userId: r.user.id,
          name: r.user.name,
          email: r.user.email,
          role: r.user.role
        }));

      res.json({
        success: true,
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          referenceType: notification.referenceType,
          referenceId: notification.referenceId,
          createdBy: notification.createdBy,
          createdAt: notification.createdAt,
          totalRecipients: notification.recipients.length,
          readCount: readBy.length,
          unreadCount: unreadBy.length,
          readBy,
          unreadBy
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all notifications with read statistics (Manager/Admin only)
  async getAllWithStats(req, res, next) {
    try {
      const { role } = req.user;

      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
          success: false,
          messageKey: 'notifications.errors.adminOnly'
        });
      }

      const { type, priority } = req.query;

      const where = {};
      if (type) where.type = type;
      if (priority) where.priority = priority;

      // Client filtering
      if (req.clientId) {
        // Specific client selected - show only that client's notifications
        where.clientId = req.clientId;
      } else if (req.user && req.user.isServiceProvider) {
        // No client selected but service provider - show all their clients' notifications
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        if (clientIds.length > 0) {
          where.clientId = { [Op.in]: clientIds };
        } else {
          where.clientId = -1; // No clients - return empty
        }
      }

      const notifications = await Notification.findAll({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: NotificationRecipient,
            as: 'recipients',
            attributes: ['id', 'userId', 'isRead']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      const formattedNotifications = notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        createdBy: n.createdBy,
        createdAt: n.createdAt,
        totalRecipients: n.recipients.length,
        readCount: n.recipients.filter(r => r.isRead).length,
        unreadCount: n.recipients.filter(r => !r.isRead).length
      }));

      res.json({
        success: true,
        data: formattedNotifications
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new notification and send to specified users (Manager/Admin only)
  async create(req, res, next) {
    try {
      const { role } = req.user;

      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
          success: false,
          messageKey: 'notifications.errors.adminOnly'
        });
      }

      // Require clientId for creating notifications
      if (!req.clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      const { type, title, message, priority, referenceType, referenceId, recipientIds, sendToAll } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          messageKey: 'notifications.errors.requiredFields'
        });
      }

      const notification = await Notification.create({
        type,
        title,
        message,
        priority: priority || 'medium',
        referenceType,
        referenceId,
        createdById: req.user.id,
        clientId: req.clientId
      });

      let userIds = [];
      if (sendToAll) {
        const users = await User.findAll({
          where: { isActive: true },
          attributes: ['id']
        });
        userIds = users.map(u => u.id);
      } else if (recipientIds && recipientIds.length > 0) {
        userIds = recipientIds;
      } else {
        const users = await User.findAll({
          where: { isActive: true },
          attributes: ['id']
        });
        userIds = users.map(u => u.id);
      }

      const recipientData = userIds.map(userId => ({
        notificationId: notification.id,
        userId,
        isRead: false,
        createdAt: new Date()
      }));

      await NotificationRecipient.bulkCreate(recipientData);

      res.status(201).json({
        success: true,
        data: {
          ...notification.toJSON(),
          recipientCount: userIds.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a notification (Manager/Admin only)
  async update(req, res, next) {
    try {
      const { role } = req.user;

      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
          success: false,
          messageKey: 'notifications.errors.adminOnly'
        });
      }

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const notification = await Notification.findOne({ where });

      if (!notification) {
        return res.status(404).json({
          success: false,
          messageKey: 'notifications.errors.notFound'
        });
      }

      const { title, message, priority } = req.body;

      await notification.update({
        title: title || notification.title,
        message: message || notification.message,
        priority: priority || notification.priority
      });

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a notification (Manager/Admin only)
  async delete(req, res, next) {
    try {
      const { role } = req.user;

      if (role !== 'admin' && role !== 'manager') {
        return res.status(403).json({
          success: false,
          messageKey: 'notifications.errors.adminOnly'
        });
      }

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const notification = await Notification.findOne({ where });

      if (!notification) {
        return res.status(404).json({
          success: false,
          messageKey: 'notifications.errors.notFound'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        messageKey: 'notifications.success.deleted'
      });
    } catch (error) {
      next(error);
    }
  },

  // Clear all notifications for current user
  async clearMine(req, res, next) {
    try {
      const userId = req.user.id;

      await NotificationRecipient.destroy({
        where: { userId }
      });

      res.json({
        success: true,
        messageKey: 'notifications.success.cleared'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
