const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Routes for all authenticated users
router.get('/', notificationController.getAll);                          // Get my notifications
router.get('/unread-count', notificationController.getUnreadCount);      // Get my unread count
router.put('/:id/read', notificationController.markAsRead);              // Mark one as read
router.put('/read-all', notificationController.markAllAsRead);           // Mark all as read
router.delete('/clear-mine', notificationController.clearMine);          // Clear my notifications

// Routes for Manager/Admin only
router.get('/admin/all', notificationController.getAllWithStats);        // Get all notifications with stats
router.get('/admin/:id/recipients', notificationController.getNotificationRecipients); // Get who read/didn't read
router.post('/', notificationController.create);                         // Create notification
router.put('/:id', notificationController.update);                       // Update notification
router.delete('/:id', notificationController.delete);                    // Delete notification

module.exports = router;
