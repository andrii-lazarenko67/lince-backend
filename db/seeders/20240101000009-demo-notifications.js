'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo, hours = 12) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
      return date;
    };

    // Create notifications (shared content)
    const notifications = [
      {
        type: 'incident',
        title: 'CRITICAL: Legionella Alert',
        message: 'Legionella count above limit in Cooling Tower 1. Immediate action required.',
        priority: 'critical',
        referenceType: 'Incident',
        referenceId: 3,
        createdById: 1,
        createdAt: getDate(5, 10)
      },
      {
        type: 'incident',
        title: 'Incident Resolved',
        message: 'The incident "Legionella Alert in cooling tower" has been successfully resolved.',
        priority: 'medium',
        referenceType: 'Incident',
        referenceId: 3,
        createdById: 1,
        createdAt: getDate(3, 16)
      },
      {
        type: 'inspection',
        title: 'Scheduled Inspection',
        message: 'Safety inspection of the Steam Boiler scheduled for the next 10 days.',
        priority: 'medium',
        referenceType: 'Inspection',
        referenceId: 25,
        createdById: 1,
        createdAt: getDate(0, 8)
      },
      {
        type: 'stock',
        title: 'Low Stock Alert',
        message: 'Stock of Sodium Hypochlorite 12% is below minimum level (100L remaining).',
        priority: 'high',
        referenceType: 'Product',
        referenceId: 1,
        createdById: null,
        createdAt: getDate(1, 9)
      },
      {
        type: 'alert',
        title: 'Parameter Out of Range',
        message: 'pH of Olympic Pool measured at 7.9, above maximum limit of 7.8.',
        priority: 'high',
        referenceType: 'System',
        referenceId: 1,
        createdById: null,
        createdAt: getDate(7, 10)
      },
      {
        type: 'incident',
        title: 'New Incident Reported',
        message: 'Excessive vibration detected in Cooling Tower 1 fan.',
        priority: 'medium',
        referenceType: 'Incident',
        referenceId: 9,
        createdById: 2,
        createdAt: getDate(3, 8)
      },
      {
        type: 'inspection',
        title: 'Inspection Completed',
        message: 'Regulatory inspection of the Main WTP completed successfully.',
        priority: 'low',
        referenceType: 'Inspection',
        referenceId: 18,
        createdById: 2,
        createdAt: getDate(10, 11)
      },
      {
        type: 'stock',
        title: 'Low Stock Alert',
        message: 'Stock of Industrial THPS Bactericide is below minimum level.',
        priority: 'high',
        referenceType: 'Product',
        referenceId: 10,
        createdById: null,
        createdAt: getDate(2, 14)
      },
      {
        type: 'system',
        title: 'Monthly Report Available',
        message: 'The monthly water quality report for November is available for download.',
        priority: 'low',
        referenceType: null,
        referenceId: null,
        createdById: 1,
        createdAt: getDate(0, 6)
      },
      {
        type: 'system',
        title: 'Scheduled Maintenance',
        message: 'Preventive maintenance of the Main WTP scheduled for the 15th.',
        priority: 'medium',
        referenceType: 'System',
        referenceId: 6,
        createdById: 1,
        createdAt: getDate(5, 9)
      },
      {
        type: 'alert',
        title: 'High Turbidity Detected',
        message: 'Raw water turbidity at Main WTP above 100 NTU.',
        priority: 'high',
        referenceType: 'System',
        referenceId: 6,
        createdById: null,
        createdAt: getDate(20, 6)
      },
      {
        type: 'system',
        title: 'Registration Reminder',
        message: 'Don\'t forget to record the daily data for the Olympic Pool.',
        priority: 'low',
        referenceType: 'System',
        referenceId: 1,
        createdById: null,
        createdAt: getDate(1, 7)
      }
    ];

    await queryInterface.bulkInsert('Notifications', notifications, {});

    // Get the inserted notification IDs
    const insertedNotifications = await queryInterface.sequelize.query(
      'SELECT id FROM "Notifications" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create recipients for each notification
    // userIds: 1 = Manager Carlos, 2 = Manager Ana, 3 = Tech Pedro, 4 = Tech Maria, 5 = Tech João
    const allUserIds = [1, 2, 3, 4, 5];
    const recipients = [];

    const daysOldArray = [5, 3, 0, 1, 7, 3, 10, 2, 0, 5, 20, 1];
    const now = new Date();

    insertedNotifications.forEach((notification, index) => {
      // Send all notifications to all users
      allUserIds.forEach(userId => {
        // Randomize read status - older notifications more likely to be read
        const daysOld = daysOldArray[index] || 0;
        const isRead = daysOld > 2 ? Math.random() > 0.3 : Math.random() > 0.7;
        const notifData = notifications[index];

        recipients.push({
          notificationId: notification.id,
          userId,
          isRead,
          createdAt: notifData ? notifData.createdAt : now
        });
      });
    });

    await queryInterface.bulkInsert('NotificationRecipients', recipients, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('NotificationRecipients', null, {});
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};
