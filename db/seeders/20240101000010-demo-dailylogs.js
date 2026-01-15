'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate historical data from February 2024 to today
    // This provides approximately 2 years of data for chart testing
    const today = new Date();
    const startDate = new Date('2024-02-01'); // Start from Feb 2024

    // Calculate total days from startDate to today
    const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

    const getDate = (dayIndex) => {
      // dayIndex 0 = startDate, dayIndex increases forward in time
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayIndex);
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

    // Create daily logs from Feb 2024 to today across ALL client systems
    // This creates approximately 2 years of historical data for chart testing
    const dailyLogs = [];

    // Helper to generate varied notes based on day patterns
    const getFieldNotes = (systemType, dayIndex) => {
      const notePatterns = {
        piscina: [
          'Operação normal. Todos os parâmetros dentro das especificações.',
          'Níveis de cloro ligeiramente abaixo do ideal. Realizado ajuste de dosagem.',
          'Sistema operando normalmente. Água cristalina.',
          'pH elevado detectado. Aplicado corretor de pH conforme procedimento.',
          'Manutenção preventiva realizada. Filtros retrolavados.'
        ],
        torre: [
          'Operação estável. Delta T dentro do esperado.',
          'Ciclos de concentração ajustados. Purga aumentada temporariamente.',
          'Torre operando em condições normais. Sistema de resfriamento eficiente.',
          'Ajuste de purga realizado. Condutividade normalizada.',
          'ATENÇÃO: Contagem bacteriana elevada detectada. Iniciado tratamento de choque com biocida.'
        ],
        caldeira: [
          'Caldeira operando em capacidade nominal. Qualidade do vapor dentro das especificações.',
          'Dureza residual detectada na água de alimentação. Verificar regeneração do abrandador.',
          'Descarga de fundo realizada. Sólidos totais dentro do limite.',
          'Pressão de operação estável. Sem vazamentos detectados.'
        ],
        eta: [
          'Produção de água tratada normal. Todos os parâmetros conforme Portaria de Potabilidade.',
          'Turbidez da água bruta elevada devido às chuvas. Ajustada dosagem de coagulante.',
          'Filtros retrolavados. Qualidade do filtrado excelente.',
          'Cloro residual ajustado. Dosagem otimizada.'
        ],
        ete: [
          'Efluente final dentro dos parâmetros de lançamento. Sistema biológico estável.',
          'DQO de entrada acima do normal. Verificar fontes de efluentes na indústria.',
          'Aeradores funcionando normalmente. OD adequado no tanque de aeração.',
          'Lodo descartado. Idade do lodo mantida conforme projeto.'
        ],
        efluente: [
          'Linha 1 operando normalmente. Vazão constante.',
          'pH ajustado antes do tratamento. Efluente dentro dos padrões.',
          'Temperatura dentro da faixa operacional.',
          'Sistema de equalização funcionando corretamente.'
        ]
      };

      const patterns = notePatterns[systemType] || notePatterns.piscina;
      return patterns[dayIndex % patterns.length];
    };

    // ===== CLIENT 1: Hotel Praia Azul =====
    // System 1: Piscina Principal (userId: Pedro technician) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('piscina', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 2: Piscina Infantil (userId: Maria technician) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('piscina', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== CLIENT 2: Condomínio Solar das Palmeiras =====
    // System 3: Torre de Resfriamento 1 (userId: Pedro) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('torre', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 4: Torre de Resfriamento 2 (userId: Maria) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('torre', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== CLIENT 3: Indústria Metalúrgica Norte =====
    // System 5: Caldeira (userId: João technician) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('caldeira', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 6: ETA (userId: Pedro) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('eta', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 7: ETE (userId: Maria) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('ete', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 8: Sistema de Efluentes Linha 1 (userId: João) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('efluente', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== CLIENT 4: Empresa Cliente Final =====
    // System 9: Piscina Aquecida (userId: End customer admin) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('piscina', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 10: Torre de Resfriamento Data Center (userId: Carlos) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('torre', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // System 11: ETE Corporativa (userId: End customer admin) - Daily records
    for (let i = 0; i < totalDays; i++) {
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
        notes: getFieldNotes('ete', i),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // ===== LABORATORY RECORDS =====
    // Add laboratory analysis records for various systems (weekly frequency)
    // Calculate total weeks from start to today
    const totalWeeks = Math.ceil(totalDays / 7);

    // Laboratory records for Piscina Principal - Client 1 (weekly)
    for (let i = 0; i < totalWeeks; i++) {
      const dayIndex = i * 7;
      if (dayIndex >= totalDays) break;
      dailyLogs.push({
        systemId: systemMap.piscina.id,
        clientId: systemMap.piscina.clientId,
        userId: userMap.pedro,
        date: getDate(dayIndex),
        recordType: 'laboratory',
        stageId: null,
        period: null,
        time: null,
        timeMode: null,
        laboratory: 'Laboratório Central de Análises',
        collectionDate: getDate(Math.min(dayIndex + 1, totalDays - 1)),
        collectionTime: '09:00',
        collectionTimeMode: 'manual',
        notes: i % 4 === 0
          ? 'Análise microbiológica: Coliformes totais dentro do limite. Amostra coletada conforme protocolo.'
          : 'Análise laboratorial completa realizada. Resultados dentro dos padrões da ABNT NBR.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Laboratory records for Torre de Resfriamento - Client 2 (weekly)
    for (let i = 0; i < totalWeeks; i++) {
      const dayIndex = i * 7;
      if (dayIndex >= totalDays) break;
      dailyLogs.push({
        systemId: systemMap.torre.id,
        clientId: systemMap.torre.clientId,
        userId: userMap.maria,
        date: getDate(dayIndex),
        recordType: 'laboratory',
        stageId: null,
        period: null,
        time: null,
        timeMode: null,
        laboratory: 'AquaLab Análises Industriais',
        collectionDate: getDate(Math.min(dayIndex + 1, totalDays - 1)),
        collectionTime: '10:30',
        collectionTimeMode: 'manual',
        notes: i % 4 === 1
          ? 'Análise de Legionella: Resultado negativo. Sistema em conformidade com normas de segurança.'
          : 'Análise de corrosão e incrustação realizada. Índices de Langelier e Ryznar calculados.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Laboratory records for ETA - Client 3 (weekly)
    for (let i = 0; i < totalWeeks; i++) {
      const dayIndex = i * 7;
      if (dayIndex >= totalDays) break;
      dailyLogs.push({
        systemId: systemMap.eta.id,
        clientId: systemMap.eta.clientId,
        userId: userMap.joao,
        date: getDate(dayIndex),
        recordType: 'laboratory',
        stageId: null,
        period: null,
        time: null,
        timeMode: null,
        laboratory: 'Laboratório de Potabilidade SANASA',
        collectionDate: getDate(Math.min(dayIndex + 1, totalDays - 1)),
        collectionTime: '08:00',
        collectionTimeMode: 'manual',
        notes: i % 4 === 2
          ? 'Análise de potabilidade completa conforme Portaria GM/MS 888/2021. Todos os parâmetros aprovados.'
          : 'Análise de metais pesados e compostos orgânicos. Resultados dentro dos limites permitidos.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Laboratory records for ETE - Client 3 (weekly)
    for (let i = 0; i < totalWeeks; i++) {
      const dayIndex = i * 7;
      if (dayIndex >= totalDays) break;
      dailyLogs.push({
        systemId: systemMap.ete.id,
        clientId: systemMap.ete.clientId,
        userId: userMap.maria,
        date: getDate(dayIndex),
        recordType: 'laboratory',
        stageId: null,
        period: null,
        time: null,
        timeMode: null,
        laboratory: 'EcoLab Análises Ambientais',
        collectionDate: getDate(Math.min(dayIndex + 1, totalDays - 1)),
        collectionTime: '14:00',
        collectionTimeMode: 'manual',
        notes: i % 4 === 3
          ? 'DBO5 e DQO analisados. Eficiência de remoção acima de 90%. Sistema em excelente condição.'
          : 'Análise de lançamento conforme CONAMA 430. Efluente aprovado para descarte.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Laboratory records for Caldeira - Client 3 (bi-weekly)
    const totalBiweeks = Math.ceil(totalDays / 14);
    for (let i = 0; i < totalBiweeks; i++) {
      const dayIndex = i * 14;
      if (dayIndex >= totalDays) break;
      dailyLogs.push({
        systemId: systemMap.caldeira.id,
        clientId: systemMap.caldeira.clientId,
        userId: userMap.joao,
        date: getDate(dayIndex),
        recordType: 'laboratory',
        stageId: null,
        period: null,
        time: null,
        timeMode: null,
        laboratory: 'ThermoLab Análises Térmicas',
        collectionDate: getDate(Math.min(dayIndex + 1, totalDays - 1)),
        collectionTime: '07:30',
        collectionTimeMode: 'manual',
        notes: i % 2 === 1
          ? 'Análise de sílica e alcalinidade. Necessário ajuste no tratamento de água de make-up.'
          : 'Análise completa de água de caldeira. Fosfato e sulfito dentro dos limites operacionais.',
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

    // Get full monitoring point data including min/max values
    const monitoringPointsFull = await queryInterface.sequelize.query(
      'SELECT id, "systemId", name, "minValue", "maxValue" FROM "MonitoringPoints" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const dailyLogEntries = [];

    // Helper function to generate realistic value within or near specification range
    const generateRealisticValue = (minValue, maxValue, dayIndex, shouldBeOutOfRange = false) => {
      // Parse values as floats (they come as strings from database)
      const min = minValue !== null ? parseFloat(minValue) : 0;
      const max = maxValue !== null ? parseFloat(maxValue) : 100;
      const range = max - min || 1; // Prevent division by zero

      if (shouldBeOutOfRange) {
        // Generate value outside the range (either below min or above max)
        const aboveOrBelow = Math.random() > 0.5;
        if (aboveOrBelow) {
          // Above max by 10-30% of range
          return max + (range * (0.1 + Math.random() * 0.2));
        } else {
          // Below min by 10-30% of range (but not negative for most parameters)
          const belowValue = min - (range * (0.1 + Math.random() * 0.2));
          return Math.max(0, belowValue); // Ensure non-negative
        }
      }

      // Generate value within range with some natural variation
      // Add slight trends based on day index to make charts more interesting
      const trendFactor = Math.sin(dayIndex / 5) * 0.1; // Creates wave pattern
      const basePosition = 0.3 + Math.random() * 0.4; // 30-70% of range (centered)
      const position = Math.max(0, Math.min(1, basePosition + trendFactor));

      return min + (range * position);
    };

    // Define out-of-range patterns for each system type (using modular arithmetic for long periods)
    // These patterns create realistic scenarios where issues occur periodically
    const outOfRangePatterns = {
      piscina: { period: 30, problemDays: [5, 15, 22] },   // Pool issues repeat every ~30 days
      torre: { period: 30, problemDays: [3, 8, 18, 25] },  // Cooling tower issues
      caldeira: { period: 30, problemDays: [7, 14, 21] },  // Boiler issues
      eta: { period: 30, problemDays: [10, 20, 28] },      // Water treatment issues
      ete: { period: 30, problemDays: [6, 12, 20, 26] },   // Wastewater treatment issues
    };

    // Get system name to determine out-of-range pattern
    const getSystemCategory = (systemId) => {
      const system = systems.find(s => s.id === systemId);
      if (!system) return 'default';
      const name = system.name.toLowerCase();
      if (name.includes('piscina')) return 'piscina';
      if (name.includes('torre')) return 'torre';
      if (name.includes('caldeira')) return 'caldeira';
      if (name.includes('eta')) return 'eta';
      if (name.includes('ete') || name.includes('efluente')) return 'ete';
      return 'default';
    };

    // Track log index per system to determine day offset
    const logIndexBySystem = {};

    for (const log of insertedLogs) {
      // Initialize counter for this system
      if (!logIndexBySystem[log.systemId]) {
        logIndexBySystem[log.systemId] = 0;
      }
      const dayIndex = logIndexBySystem[log.systemId]++;

      // Get monitoring points for this system
      const systemPoints = monitoringPointsFull.filter(mp => mp.systemId === log.systemId);
      const systemCategory = getSystemCategory(log.systemId);
      const pattern = outOfRangePatterns[systemCategory] || { period: 30, problemDays: [10, 20] };

      for (const point of systemPoints) {
        // Determine if this day should have out-of-range values
        // Use modular arithmetic so problems recur periodically (realistic for long-term data)
        const dayInCycle = dayIndex % pattern.period;
        const isProblemDay = pattern.problemDays.includes(dayInCycle);
        // ~8% base chance of out-of-range, ~70% chance on problem days
        const shouldBeOutOfRange = isProblemDay ? Math.random() > 0.3 : Math.random() > 0.92;

        // Generate realistic value based on monitoring point specifications
        const value = generateRealisticValue(
          point.minValue,
          point.maxValue,
          dayIndex,
          shouldBeOutOfRange
        );

        // Parse limits for comparison
        const minLimit = point.minValue !== null ? parseFloat(point.minValue) : null;
        const maxLimit = point.maxValue !== null ? parseFloat(point.maxValue) : null;

        // Determine if actually out of range based on value vs limits
        const isOutOfRange = minLimit !== null && maxLimit !== null
          ? (value < minLimit || value > maxLimit)
          : shouldBeOutOfRange;

        dailyLogEntries.push({
          dailyLogId: log.id,
          monitoringPointId: point.id,
          value: parseFloat(value.toFixed(2)),
          isOutOfRange: isOutOfRange,
          notes: isOutOfRange
            ? `Valor ${maxLimit !== null && value > maxLimit ? 'acima do máximo' : 'abaixo do mínimo'} permitido. Verificar condições operacionais.`
            : null,
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
