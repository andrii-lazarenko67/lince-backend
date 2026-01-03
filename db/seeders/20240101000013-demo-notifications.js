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

    // Fetch actual user IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'manager@lince.com') userMap.carlos = user.id;
      else if (user.email === 'ana.santos@lince.com') userMap.ana = user.id;
      else if (user.email === 'technician@lince.com') userMap.pedro = user.id;
      else if (user.email === 'maria.costa@lince.com') userMap.maria = user.id;
      else if (user.email === 'joao.ferreira@lince.com') userMap.joao = user.id;
    });

    // Fetch actual system IDs
    const systems = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Piscina Principal - Hotel Sunset') systemMap.piscina = system.id;
      else if (system.name === 'Torre de Resfriamento - Unidade 1') systemMap.torre1 = system.id;
      else if (system.name === 'ETA - Estação de Tratamento') systemMap.eta = system.id;
    });

    // Fetch actual incident IDs
    const incidents = await queryInterface.sequelize.query(
      'SELECT id, title FROM "Incidents" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create incident lookup
    const incidentMap = {};
    incidents.forEach((incident, idx) => {
      incidentMap[idx + 1] = incident.id;
    });

    // Fetch actual inspection IDs
    const inspections = await queryInterface.sequelize.query(
      'SELECT id FROM "Inspections" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create inspection lookup
    const inspectionMap = {};
    inspections.forEach((inspection, idx) => {
      inspectionMap[idx + 1] = inspection.id;
    });

    // Fetch actual product IDs
    const products = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Products" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create product lookup
    const productMap = {};
    products.forEach((product, idx) => {
      productMap[idx + 1] = product.id;
    });

    // Create notifications using translation keys
    const notifications = [
      {
        type: 'incident',
        title: 'notifications.seed.legionellaAlert.title',
        message: 'notifications.seed.legionellaAlert.message',
        priority: 'critical',
        referenceType: 'Incident',
        referenceId: incidentMap[3] || null,
        createdById: userMap.carlos,
        createdAt: getDate(5, 10)
      },
      {
        type: 'incident',
        title: 'notifications.seed.incidentResolved.title',
        message: 'notifications.seed.incidentResolved.message',
        priority: 'medium',
        referenceType: 'Incident',
        referenceId: incidentMap[3] || null,
        createdById: userMap.carlos,
        createdAt: getDate(3, 16)
      },
      {
        type: 'inspection',
        title: 'notifications.seed.inspectionScheduled.title',
        message: 'notifications.seed.inspectionScheduled.message',
        priority: 'medium',
        referenceType: 'Inspection',
        referenceId: inspectionMap[25] || inspectionMap[1] || null,
        createdById: userMap.carlos,
        createdAt: getDate(0, 8)
      },
      {
        type: 'stock',
        title: 'notifications.messages.lowStock.title',
        message: 'notifications.seed.lowStockHypochlorite.message',
        priority: 'high',
        referenceType: 'Product',
        referenceId: productMap[1] || null,
        createdById: null,
        createdAt: getDate(1, 9)
      },
      {
        type: 'alert',
        title: 'notifications.seed.parameterOutOfRange.title',
        message: 'notifications.seed.parameterOutOfRange.message',
        priority: 'high',
        referenceType: 'System',
        referenceId: systemMap.piscina,
        createdById: null,
        createdAt: getDate(7, 10)
      },
      {
        type: 'incident',
        title: 'notifications.messages.incident.title',
        message: 'notifications.seed.vibrationDetected.message',
        priority: 'medium',
        referenceType: 'Incident',
        referenceId: incidentMap[9] || null,
        createdById: userMap.ana,
        createdAt: getDate(3, 8)
      },
      {
        type: 'inspection',
        title: 'notifications.seed.inspectionCompleted.title',
        message: 'notifications.seed.inspectionCompleted.message',
        priority: 'low',
        referenceType: 'Inspection',
        referenceId: inspectionMap[18] || inspectionMap[1] || null,
        createdById: userMap.ana,
        createdAt: getDate(10, 11)
      },
      {
        type: 'stock',
        title: 'notifications.messages.lowStock.title',
        message: 'notifications.seed.lowStockBactericide.message',
        priority: 'high',
        referenceType: 'Product',
        referenceId: productMap[10] || productMap[1] || null,
        createdById: null,
        createdAt: getDate(2, 14)
      },
      {
        type: 'system',
        title: 'notifications.seed.monthlyReport.title',
        message: 'notifications.seed.monthlyReport.message',
        priority: 'low',
        referenceType: null,
        referenceId: null,
        createdById: userMap.carlos,
        createdAt: getDate(0, 6)
      },
      {
        type: 'system',
        title: 'notifications.seed.scheduledMaintenance.title',
        message: 'notifications.seed.scheduledMaintenance.message',
        priority: 'medium',
        referenceType: 'System',
        referenceId: systemMap.eta,
        createdById: userMap.carlos,
        createdAt: getDate(5, 9)
      },
      {
        type: 'alert',
        title: 'notifications.seed.highTurbidity.title',
        message: 'notifications.seed.highTurbidity.message',
        priority: 'high',
        referenceType: 'System',
        referenceId: systemMap.eta,
        createdById: null,
        createdAt: getDate(20, 6)
      },
      {
        type: 'system',
        title: 'notifications.seed.recordReminder.title',
        message: 'notifications.seed.recordReminder.message',
        priority: 'low',
        referenceType: 'System',
        referenceId: systemMap.piscina,
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

    // Create recipients for each notification - get actual user IDs
    const allUserIds = users.map(u => u.id);
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

    // Reset sequences to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Notifications"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Notifications"), 0),
        true
      );
    `);
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"NotificationRecipients"', 'id'),
        COALESCE((SELECT MAX(id) FROM "NotificationRecipients"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('NotificationRecipients', null, {});
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};
