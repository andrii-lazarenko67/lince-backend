'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0]; // DATEONLY format
    };

    // Create daily logs for the past 30 days across different systems
    const dailyLogs = [];

    // System 1: Piscina Principal (userId: 3 - Pedro technician)
    for (let i = 0; i < 30; i++) {
      dailyLogs.push({
        systemId: 1,
        userId: 3,
        date: getDate(i),
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
        systemId: 2,
        userId: 4,
        date: getDate(i),
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
        systemId: 3,
        userId: 3,
        date: getDate(i),
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
        systemId: 5,
        userId: 5,
        date: getDate(i),
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
        systemId: 6,
        userId: 3,
        date: getDate(i),
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
        systemId: 7,
        userId: 4,
        date: getDate(i),
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
