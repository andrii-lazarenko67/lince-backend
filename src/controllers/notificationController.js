const { Notification } = require('../../db/models');

const notificationController = {
  async getAll(req, res, next) {
    try {
      const { isRead, type } = req.query;
      const userId = req.user.id;

      const where = { userId };

      if (isRead !== undefined) where.isRead = isRead === 'true';
      if (type) where.type = type;

      const notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      const count = await Notification.count({
        where: { userId, isRead: false }
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const notification = await Notification.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const notification = await Notification.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
