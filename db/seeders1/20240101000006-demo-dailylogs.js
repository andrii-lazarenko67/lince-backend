'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0]; // DATEONLY format
    };

    // Fetch actual inserted user and system IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const systems = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'technician@lince.com') userMap.peter = user.id; // Peter
      else if (user.email === 'mary.brown@lince.com') userMap.mary = user.id; // Mary
      else if (user.email === 'john.davis@lince.com') userMap.john = user.id; // John
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Main Pool - Sunset Hotel') systemMap.pool = system.id;
      else if (system.name === 'Children\'s Pool - Sunset Hotel') systemMap.childpool = system.id;
      else if (system.name === 'Cooling Tower - Unit 1') systemMap.tower = system.id;
      else if (system.name === 'Steam Boiler - Main') systemMap.boiler = system.id;
      else if (system.name === 'WTP - Water Treatment Plant') systemMap.wtp = system.id;
      else if (system.name === 'WWTP - Wastewater Treatment') systemMap.wwtp = system.id;
    });

    // Create daily logs for the past 30 days across different systems
    const dailyLogs = [];

    // System 1: Main Pool (userId: 3 - Peter technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.pool,
        userId: userMap.peter,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '08:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 10 === 0
          ? 'Chlorine levels slightly below optimal. Adjusted dosage.'
          : 'Normal operation. All parameters within specifications.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 2: Children's Pool (userId: 4 - Mary technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.childpool,
        userId: userMap.mary,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'afternoon',
        time: '14:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 15 === 0
          ? 'High pH detected. Applied pH reducer according to procedure.'
          : 'System operating normally. Crystal clear water.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 3: Cooling Tower 1 (userId: 3 - Peter)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.tower,
        userId: userMap.peter,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '09:30',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i === 5
          ? 'WARNING: Elevated bacterial count detected. Initiated shock treatment with biocide.'
          : (i % 7 === 0
            ? 'Concentration cycles adjusted. Blowdown temporarily increased.'
            : 'Stable operation. Delta T within expected range.'),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 5: Boiler (userId: 5 - John technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.boiler,
        userId: userMap.john,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '07:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i === 12
          ? 'Residual hardness detected in feedwater. Check softener regeneration.'
          : 'Boiler operating at nominal capacity. Steam quality within specifications.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 6: WTP (userId: 3 - Peter)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.wtp,
        userId: userMap.peter,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'afternoon',
        time: '15:30',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i === 20
          ? 'Raw water turbidity elevated due to rainfall. Adjusted coagulant dosage.'
          : 'Normal treated water production. All parameters per Potability Standards.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 7: WWTP (userId: 4 - Mary)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.wwtp,
        userId: userMap.mary,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'evening',
        time: '17:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i === 8
          ? 'Inlet COD above normal. Check effluent sources in facility.'
          : 'Final effluent within discharge parameters. Biological system stable.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('DailyLogs', dailyLogs, {});

    // Get the inserted daily logs to reference their IDs
    const insertedLogs = await queryInterface.sequelize.query(
      'SELECT id, "systemId" FROM "DailyLogs" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get monitoring points
    const monitoringPoints = await queryInterface.sequelize.query(
      'SELECT id, "systemId" FROM "MonitoringPoints" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const dailyLogEntries = [];

    for (const log of insertedLogs) {
      // Get monitoring points for this system
      const systemPoints = monitoringPoints.filter(mp => mp.systemId === log.systemId);

      for (const point of systemPoints) {
        // Generate realistic values (random between 50-150)
        const value = (50 + Math.random() * 100).toFixed(2);
        const isOutOfRange = Math.random() > 0.9; // 10% out of range

        dailyLogEntries.push({
          dailyLogId: log.id,
          monitoringPointId: point.id,
          value: parseFloat(value),
          isOutOfRange: isOutOfRange,
          notes: isOutOfRange ? 'Value out of expected range. Check operating conditions.' : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('DailyLogEntries', dailyLogEntries, {});

    // Reset sequences to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"DailyLogs"', 'id'),
        COALESCE((SELECT MAX(id) FROM "DailyLogs"), 0),
        true
      );
    `);
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"DailyLogEntries"', 'id'),
        COALESCE((SELECT MAX(id) FROM "DailyLogEntries"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('DailyLogEntries', null, {});
    await queryInterface.bulkDelete('DailyLogs', null, {});
  }
};
