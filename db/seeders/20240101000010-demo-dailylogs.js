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
      'SELECT id, name, "clientId" FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'technician@lince.com') userMap.pedro = user.id; // Pedro
      else if (user.email === 'maria.costa@lince.com') userMap.maria = user.id; // Maria
      else if (user.email === 'joao.ferreira@lince.com') userMap.joao = user.id; // João
      else if (user.email === 'cliente@endcustomer.com') userMap.endcustomer = user.id; // End customer admin (Ricardo)
      else if (user.email === 'manager@lince.com') userMap.carlos = user.id; // Carlos (Manager)
    });

    // Create system lookup by name (with clientId)
    const systemMap = {};
    systems.forEach(system => {
      // Client 1 systems
      if (system.name === 'Piscina Principal - Hotel Sunset') systemMap.piscina = { id: system.id, clientId: system.clientId };
      else if (system.name === 'Piscina Infantil - Hotel Sunset') systemMap.infantil = { id: system.id, clientId: system.clientId };
      // Client 2 systems
      else if (system.name === 'Torre de Resfriamento - Unidade 1') systemMap.torre = { id: system.id, clientId: system.clientId };
      else if (system.name === 'Torre de Resfriamento - Unidade 2') systemMap.torre2 = { id: system.id, clientId: system.clientId };
      // Client 3 systems
      else if (system.name === 'Caldeira a Vapor - Principal') systemMap.caldeira = { id: system.id, clientId: system.clientId };
      else if (system.name === 'ETA - Estação de Tratamento') systemMap.eta = { id: system.id, clientId: system.clientId };
      else if (system.name === 'ETE - Tratamento de Efluentes') systemMap.ete = { id: system.id, clientId: system.clientId };
      else if (system.name === 'Sistema de Efluentes - Linha 1') systemMap.efluente = { id: system.id, clientId: system.clientId };
      // Client 4 systems
      else if (system.name === 'Piscina Aquecida - Área de Lazer') systemMap.piscinaClient4 = { id: system.id, clientId: system.clientId };
      else if (system.name === 'Torre de Resfriamento - Data Center') systemMap.torreClient4 = { id: system.id, clientId: system.clientId };
      else if (system.name === 'ETE - Corporativa') systemMap.eteClient4 = { id: system.id, clientId: system.clientId };
    });

    // Create daily logs for the past 30 days across ALL client systems
    const dailyLogs = [];

    // ===== CLIENT 1: Hotel Praia Azul =====
    // System 1: Piscina Principal (userId: Pedro technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.piscina.id,
        clientId: systemMap.piscina.clientId,
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

    // System 2: Piscina Infantil (userId: Maria technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.infantil.id,
        clientId: systemMap.infantil.clientId,
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

    // ===== CLIENT 2: Condomínio Solar das Palmeiras =====
    // System 3: Torre de Resfriamento 1 (userId: Pedro)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.torre.id,
        clientId: systemMap.torre.clientId,
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

    // System 4: Torre de Resfriamento 2 (userId: Maria)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.torre2.id,
        clientId: systemMap.torre2.clientId,
        userId: userMap.maria,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '10:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 8 === 0
          ? 'Ajuste de purga realizado. Condutividade normalizada.'
          : 'Torre operando em condições normais. Sistema de resfriamento eficiente.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== CLIENT 3: Indústria Metalúrgica Norte =====
    // System 5: Caldeira (userId: João technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.caldeira.id,
        clientId: systemMap.caldeira.clientId,
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

    // System 6: ETA (userId: Pedro)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.eta.id,
        clientId: systemMap.eta.clientId,
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

    // System 7: ETE (userId: Maria)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.ete.id,
        clientId: systemMap.ete.clientId,
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

    // System 8: Sistema de Efluentes Linha 1 (userId: João)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: systemMap.efluente.id,
        clientId: systemMap.efluente.clientId,
        userId: userMap.joao,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'afternoon',
        time: '16:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 12 === 0
          ? 'pH ajustado antes do tratamento. Efluente dentro dos padrões.'
          : 'Linha 1 operando normalmente. Vazão constante.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== CLIENT 4: Empresa Cliente Final =====
    // System 9: Piscina Aquecida (userId: End customer admin - end customer does self-service)
    for (let i = 0; i < 20; i++) {
      dailyLogs.push({
        systemId: systemMap.piscinaClient4.id,
        clientId: systemMap.piscinaClient4.clientId,
        userId: userMap.endcustomer,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '09:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 5 === 0
          ? 'Temperatura ajustada para conforto dos usuários. Sistema de aquecimento funcionando perfeitamente.'
          : 'Piscina em condições ideais. Água aquecida e cristalina.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 10: Torre de Resfriamento Data Center (userId: Carlos - service provider manager)
    for (let i = 0; i < 25; i++) {
      dailyLogs.push({
        systemId: systemMap.torreClient4.id,
        clientId: systemMap.torreClient4.clientId,
        userId: userMap.carlos,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'morning',
        time: '08:30',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i === 10
          ? 'CRÍTICO: Temperatura do data center ligeiramente elevada. Verificado sistema de resfriamento e ajustada vazão.'
          : (i % 6 === 0
            ? 'Manutenção preventiva realizada. Sistema funcionando perfeitamente.'
            : 'Data center mantendo temperatura ideal. Resfriamento eficiente.'),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 11: ETE Corporativa (userId: End customer admin)
    for (let i = 0; i < 20; i++) {
      dailyLogs.push({
        systemId: systemMap.eteClient4.id,
        clientId: systemMap.eteClient4.clientId,
        userId: userMap.endcustomer,
        date: getDate(i),
        recordType: 'field',
        stageId: null,
        period: 'afternoon',
        time: '15:00',
        timeMode: 'manual',
        laboratory: null,
        collectionDate: null,
        collectionTime: null,
        collectionTimeMode: null,
        notes: i % 7 === 0
          ? 'Efluente final analisado. Todos os parâmetros dentro dos limites de lançamento.'
          : 'ETE operando normalmente. Tratamento biológico estável.',
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
          notes: isOutOfRange ? 'Valor fora da faixa esperada. Verificar condições operacionais.' : null,
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
