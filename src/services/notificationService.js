const { Notification, NotificationRecipient, User } = require('../../db/models');

/**
 * Notification Service
 * Helper functions for creating and managing notifications
 */
const notificationService = {
  /**
   * Create a notification and send to specific users
   * @param {Object} params - Notification parameters
   * @param {string} params.type - Notification type: 'alert', 'incident', 'inspection', 'stock', 'system'
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} params.priority - Priority: 'low', 'medium', 'high', 'critical'
   * @param {string} params.referenceType - Reference type (e.g., 'incident', 'dailyLog')
   * @param {number} params.referenceId - Reference ID
   * @param {number} params.createdById - ID of user creating the notification (optional)
   * @param {number[]} recipientIds - Array of user IDs to send notification to
   * @returns {Promise<Notification>} Created notification
   */
  async createForUsers({ type, title, titleKey, message, messageKey, priority = 'medium', referenceType, referenceId, createdById }, recipientIds) {
    const notification = await Notification.create({
      type,
      title: titleKey || title,
      message: messageKey || message,
      priority,
      referenceType,
      referenceId,
      createdById
    });

    if (recipientIds && recipientIds.length > 0) {
      const recipientData = recipientIds.map(userId => ({
        notificationId: notification.id,
        userId,
        isRead: false,
        createdAt: new Date()
      }));

      await NotificationRecipient.bulkCreate(recipientData);
    }

    return notification;
  },

  /**
   * Create a notification and send to all managers
   * @param {Object} params - Notification parameters
   * @param {number} createdById - ID of user creating the notification (optional)
   * @returns {Promise<Notification>} Created notification
   */
  async notifyManagers({ type, title, message, priority = 'medium', referenceType, referenceId, createdById }) {
    const managers = await User.findAll({
      where: { role: 'manager', isActive: true },
      attributes: ['id']
    });

    const managerIds = managers.map(m => m.id);

    if (managerIds.length === 0) {
      return null;
    }

    return this.createForUsers(
      { type, title, message, priority, referenceType, referenceId, createdById },
      managerIds
    );
  },

  /**
   * Create a notification and send to all admins and managers
   * @param {Object} params - Notification parameters
   * @param {number} createdById - ID of user creating the notification (optional)
   * @returns {Promise<Notification>} Created notification
   */
  async notifyAdminsAndManagers({ type, title, message, priority = 'medium', referenceType, referenceId, createdById }) {
    const users = await User.findAll({
      where: {
        role: ['admin', 'manager'],
        isActive: true
      },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return null;
    }

    return this.createForUsers(
      { type, title, message, priority, referenceType, referenceId, createdById },
      userIds
    );
  },

  /**
   * Create a notification and send to all active users
   * @param {Object} params - Notification parameters
   * @param {number} createdById - ID of user creating the notification (optional)
   * @returns {Promise<Notification>} Created notification
   */
  async notifyAllUsers({ type, title, message, priority = 'medium', referenceType, referenceId, createdById }) {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return null;
    }

    return this.createForUsers(
      { type, title, message, priority, referenceType, referenceId, createdById },
      userIds
    );
  },

  /**
   * Create a notification and send to a single user
   * @param {Object} params - Notification parameters
   * @param {number} userId - User ID to send notification to
   * @returns {Promise<Notification>} Created notification
   */
  async notifyUser({ type, title, message, priority = 'medium', referenceType, referenceId, createdById }, userId) {
    return this.createForUsers(
      { type, title, message, priority, referenceType, referenceId, createdById },
      [userId]
    );
  }
};

module.exports = notificationService;
