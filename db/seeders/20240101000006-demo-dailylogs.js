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
      if (user.email === 'technician@lince.com') userMap.pedro = user.id; // Pedro
      else if (user.email === 'maria.costa@lince.com') userMap.maria = user.id; // Maria
      else if (user.email === 'joao.ferreira@lince.com') userMap.joao = user.id; // João
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Piscina Principal - Hotel Sunset') systemMap.piscina = system.id;
      else if (system.name === 'Piscina Infantil - Hotel Sunset') systemMap.infantil = system.id;
      else if (system.name === 'Torre de Resfriamento - Unidade 1') systemMap.torre = system.id;
      else if (system.name === 'Caldeira a Vapor - Principal') systemMap.caldeira = system.id;
      else if (system.name === 'ETA - Estação de Tratamento') systemMap.eta = system.id;
      else if (system.name === 'ETE - Tratamento de Efluentes') systemMap.ete = system.id;
    });

    // Create daily logs for the past 30 days across different systems
    const dailyLogs = [];

    // System 1: Piscina Principal (userId: 3 - Pedro technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.piscina,
        userId: userMap.pedro,
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
          ? 'Níveis de cloro ligeiramente abaixo do ideal. Realizado ajuste de dosagem.'
          : 'Operação normal. Todos os parâmetros dentro das especificações.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 2: Piscina Infantil (userId: 4 - Maria technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.infantil,
        userId: userMap.maria,
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
          ? 'pH elevado detectado. Aplicado corretor de pH conforme procedimento.'
          : 'Sistema operando normalmente. Água cristalina.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 3: Torre de Resfriamento 1 (userId: 3 - Pedro)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.torre,
        userId: userMap.pedro,
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
          ? 'ATENÇÃO: Contagem bacteriana elevada detectada. Iniciado tratamento de choque com biocida.'
          : (i % 7 === 0
            ? 'Ciclos de concentração ajustados. Purga aumentada temporariamente.'
            : 'Operação estável. Delta T dentro do esperado.'),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 5: Caldeira (userId: 5 - João technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.caldeira,
        userId: userMap.joao,
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
          ? 'Dureza residual detectada na água de alimentação. Verificar regeneração do abrandador.'
          : 'Caldeira operando em capacidade nominal. Qualidade do vapor dentro das especificações.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 6: ETA (userId: 3 - Pedro)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.eta,
        userId: userMap.pedro,
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
          ? 'Turbidez da água bruta elevada devido às chuvas. Ajustada dosagem de coagulante.'
          : 'Produção de água tratada normal. Todos os parâmetros conforme Portaria de Potabilidade.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 7: ETE (userId: 4 - Maria)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.ete,
        userId: userMap.maria,
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
          ? 'DQO de entrada acima do normal. Verificar fontes de efluentes na indústria.'
          : 'Efluente final dentro dos parâmetros de lançamento. Sistema biológico estável.',
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
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('DailyLogEntries', dailyLogEntries, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('DailyLogEntries', null, {});
    await queryInterface.bulkDelete('DailyLogs', null, {});
  }
};
