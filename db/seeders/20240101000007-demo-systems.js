'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert Parent Systems for ALL 4 clients
    await queryInterface.bulkInsert('Systems', [
      // CLIENT 1: Hotel Praia Azul (Service Provider Client)
      {
        parentId: null,
        name: 'Piscina Principal - Hotel Sunset',
        systemTypeId: 1,
        location: 'Área de Lazer - Bloco A',
        description: 'Piscina principal do hotel com capacidade de 500.000 litros. Uso recreativo.',
        status: 'active',
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Piscina Infantil - Hotel Sunset',
        systemTypeId: 1,
        location: 'Área de Lazer - Bloco A',
        description: 'Piscina infantil com profundidade máxima de 60cm.',
        status: 'active',
        clientId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // CLIENT 2: Condomínio Solar das Palmeiras (Service Provider Client)
      {
        parentId: null,
        name: 'Torre de Resfriamento - Unidade 1',
        systemTypeId: 2,
        location: 'Área Industrial - Setor B',
        description: 'Torre de resfriamento principal para sistema de ar condicionado central.',
        status: 'active',
        clientId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Torre de Resfriamento - Unidade 2',
        systemTypeId: 2,
        location: 'Área Industrial - Setor B',
        description: 'Torre de resfriamento secundária de backup.',
        status: 'active',
        clientId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // CLIENT 3: Indústria Metalúrgica Norte (Service Provider Client)
      {
        parentId: null,
        name: 'Caldeira a Vapor - Principal',
        systemTypeId: 3,
        location: 'Casa de Máquinas',
        description: 'Caldeira principal para geração de vapor industrial. Capacidade: 10 ton/h.',
        status: 'active',
        clientId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'ETA - Estação de Tratamento',
        systemTypeId: 4,
        location: 'Área de Utilidades',
        description: 'Estação de tratamento de água para abastecimento industrial.',
        status: 'active',
        clientId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'ETE - Tratamento de Efluentes',
        systemTypeId: 5,
        location: 'Área de Utilidades - Fundos',
        description: 'Estação de tratamento de efluentes industriais antes do descarte.',
        status: 'active',
        clientId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Sistema de Efluentes - Linha 1',
        systemTypeId: 6,
        location: 'Área de Produção',
        description: 'Sistema de coleta e tratamento de efluentes da linha de produção 1.',
        status: 'active',
        clientId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // CLIENT 4: Empresa Cliente Final (End Customer - Direct Client)
      {
        parentId: null,
        name: 'Piscina Aquecida - Área de Lazer',
        systemTypeId: 1,
        location: 'Área de Lazer',
        description: 'Piscina aquecida para uso recreativo dos funcionários.',
        status: 'active',
        clientId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Torre de Resfriamento - Data Center',
        systemTypeId: 2,
        location: 'Data Center - Piso Térreo',
        description: 'Sistema de resfriamento para refrigeração do data center corporativo.',
        status: 'active',
        clientId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'ETE - Corporativa',
        systemTypeId: 5,
        location: 'Área de Utilidades',
        description: 'Estação de tratamento de efluentes do escritório corporativo.',
        status: 'active',
        clientId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get inserted parent systems to retrieve their IDs
    const [parentSystems] = await queryInterface.sequelize.query(
      `SELECT id, name, "clientId" FROM "Systems" WHERE "parentId" IS NULL ORDER BY id;`
    );

    // Create lookup for parent systems by name
    const parentSystemMap = {};
    parentSystems.forEach(s => {
      parentSystemMap[s.name] = { id: s.id, clientId: s.clientId };
    });

    // Insert Stages (child systems) - WITH clientId inherited from parent
    await queryInterface.bulkInsert('Systems', [
      // ETE - Tratamento de Efluentes (Client 3) - Stages
      {
        parentId: parentSystemMap['ETE - Tratamento de Efluentes'].id,
        name: 'Estação Elevatória',
        systemTypeId: 5,
        location: 'ETE - Entrada',
        description: 'Bombeamento de efluentes para o sistema de tratamento.',
        status: 'active',
        clientId: parentSystemMap['ETE - Tratamento de Efluentes'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Tratamento de Efluentes'].id,
        name: 'Tanque de Aeração',
        systemTypeId: 5,
        location: 'ETE - Biológico',
        description: 'Tanque de aeração para tratamento biológico aeróbio.',
        status: 'active',
        clientId: parentSystemMap['ETE - Tratamento de Efluentes'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Tratamento de Efluentes'].id,
        name: 'Decantador Secundário',
        systemTypeId: 5,
        location: 'ETE - Clarificação',
        description: 'Decantador para separação do lodo ativado.',
        status: 'active',
        clientId: parentSystemMap['ETE - Tratamento de Efluentes'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Tratamento de Efluentes'].id,
        name: 'Filtro de Polimento',
        systemTypeId: 5,
        location: 'ETE - Final',
        description: 'Filtração final para polimento do efluente tratado.',
        status: 'active',
        clientId: parentSystemMap['ETE - Tratamento de Efluentes'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Tratamento de Efluentes'].id,
        name: 'Tanque de Efluente Tratado',
        systemTypeId: 5,
        location: 'ETE - Saída',
        description: 'Reservatório de efluente tratado antes do lançamento.',
        status: 'active',
        clientId: parentSystemMap['ETE - Tratamento de Efluentes'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ETA - Estação de Tratamento (Client 3) - Stages
      {
        parentId: parentSystemMap['ETA - Estação de Tratamento'].id,
        name: 'Captação',
        systemTypeId: 4,
        location: 'ETA - Entrada',
        description: 'Captação de água bruta.',
        status: 'active',
        clientId: parentSystemMap['ETA - Estação de Tratamento'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETA - Estação de Tratamento'].id,
        name: 'Floculador',
        systemTypeId: 4,
        location: 'ETA - Coagulação',
        description: 'Floculação para aglomeração de partículas.',
        status: 'active',
        clientId: parentSystemMap['ETA - Estação de Tratamento'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETA - Estação de Tratamento'].id,
        name: 'Decantador',
        systemTypeId: 4,
        location: 'ETA - Clarificação',
        description: 'Decantação de partículas floculadas.',
        status: 'active',
        clientId: parentSystemMap['ETA - Estação de Tratamento'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETA - Estação de Tratamento'].id,
        name: 'Filtros',
        systemTypeId: 4,
        location: 'ETA - Filtração',
        description: 'Filtração de água clarificada.',
        status: 'active',
        clientId: parentSystemMap['ETA - Estação de Tratamento'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETA - Estação de Tratamento'].id,
        name: 'Reservatório de Água Tratada',
        systemTypeId: 4,
        location: 'ETA - Saída',
        description: 'Armazenamento de água tratada.',
        status: 'active',
        clientId: parentSystemMap['ETA - Estação de Tratamento'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ETE - Corporativa (Client 4) - Stages
      {
        parentId: parentSystemMap['ETE - Corporativa'].id,
        name: 'Tratamento Preliminar',
        systemTypeId: 5,
        location: 'ETE Corporativa - Entrada',
        description: 'Gradeamento e caixa de areia.',
        status: 'active',
        clientId: parentSystemMap['ETE - Corporativa'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Corporativa'].id,
        name: 'Reator Biológico',
        systemTypeId: 5,
        location: 'ETE Corporativa - Biológico',
        description: 'Tratamento biológico de efluentes.',
        status: 'active',
        clientId: parentSystemMap['ETE - Corporativa'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['ETE - Corporativa'].id,
        name: 'Decantador',
        systemTypeId: 5,
        location: 'ETE Corporativa - Clarificação',
        description: 'Separação de sólidos.',
        status: 'active',
        clientId: parentSystemMap['ETE - Corporativa'].clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get ALL systems (parent + child) for monitoring points and checklist items
    const [systems] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Systems" ORDER BY id;`
    );

    // Get parameter and unit IDs for creating monitoring points
    const [parameters] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Parameters";`
    );
    const [units] = await queryInterface.sequelize.query(
      `SELECT id, abbreviation FROM "Units";`
    );

    // Create lookup maps
    const systemMap = {};
    systems.forEach((s, index) => { systemMap[index + 1] = s.id; });

    // Create lookup by name for all systems
    const systemByName = {};
    systems.forEach(s => { systemByName[s.name] = s.id; });

    const paramMap = {};
    parameters.forEach(p => { paramMap[p.name] = p.id; });

    const unitMap = {};
    units.forEach(u => { unitMap[u.abbreviation] = u.id; });

    // Insert Monitoring Points with foreign keys
    await queryInterface.bulkInsert('MonitoringPoints', [
      // CLIENT 1 - Piscina Principal (System 1)
      { systemId: systemMap[1], name: 'pH da Água', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Cloro Residual Livre', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Temperatura', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 24, maxValue: 30, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Turbidez', parameterId: paramMap['Turbidez'], unitId: unitMap['NTU'], minValue: 0, maxValue: 0.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Alcalinidade Total', parameterId: paramMap['Alcalinidade'], unitId: unitMap['mg/L'], minValue: 80, maxValue: 120, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 1 - Piscina Infantil (System 2)
      { systemId: systemMap[2], name: 'pH da Água', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Cloro Residual Livre', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Temperatura', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 26, maxValue: 32, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 2 - Torre de Resfriamento 1 (System 3)
      { systemId: systemMap[3], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Condutividade', parameterId: paramMap['Condutividade'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Temperatura Entrada', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Temperatura Saída', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 15, maxValue: 35, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Cloro Total', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Ciclos de Concentração', parameterId: paramMap['Ciclos'], unitId: unitMap[''], minValue: 3, maxValue: 6, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 2 - Torre de Resfriamento 2 (System 4)
      { systemId: systemMap[4], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Condutividade', parameterId: paramMap['Condutividade'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Temperatura Entrada', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Cloro Total', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - Caldeira (System 5)
      { systemId: systemMap[5], name: 'pH da Água de Alimentação', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 8.5, maxValue: 9.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Condutividade', parameterId: paramMap['Condutividade'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 3500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Dureza Total', parameterId: paramMap['Dureza'], unitId: unitMap['mg/L CaCO3'], minValue: 0, maxValue: 5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Sílica', parameterId: paramMap['Sílica'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Oxigênio Dissolvido', parameterId: paramMap['OD'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 0.007, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Ferro Total', parameterId: paramMap['Ferro'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 0.1, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Alcalinidade', parameterId: paramMap['Alcalinidade'], unitId: unitMap['mg/L'], minValue: 200, maxValue: 700, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - ETA (System 6)
      { systemId: systemMap[6], name: 'pH Entrada', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'pH Saída', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.5, maxValue: 8.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Turbidez Entrada', parameterId: paramMap['Turbidez'], unitId: unitMap['NTU'], minValue: 0, maxValue: 100, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Turbidez Saída', parameterId: paramMap['Turbidez'], unitId: unitMap['NTU'], minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Cloro Residual', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 2.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Cor Aparente', parameterId: paramMap['Cor'], unitId: unitMap['uH'], minValue: 0, maxValue: 15, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - ETE (System 7)
      { systemId: systemMap[7], name: 'pH Entrada', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 5.0, maxValue: 9.0, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'pH Saída', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 5.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'DBO Entrada', parameterId: paramMap['DBO'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 500, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'DBO Saída', parameterId: paramMap['DBO'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 60, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'DQO Saída', parameterId: paramMap['DQO'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Sólidos Sedimentáveis', parameterId: paramMap['SS'], unitId: unitMap['mL/L'], minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Oxigênio Dissolvido', parameterId: paramMap['OD'], unitId: unitMap['mg/L'], minValue: 2.0, maxValue: 8.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - Efluentes Linha 1 (System 8)
      { systemId: systemMap[8], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Temperatura', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 15, maxValue: 40, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Vazão', parameterId: paramMap['Vazão'], unitId: unitMap['m³/h'], minValue: 0, maxValue: 50, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - Piscina Aquecida (System 9)
      { systemId: systemMap[9], name: 'pH da Água', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Cloro Residual Livre', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Temperatura', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 28, maxValue: 32, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Turbidez', parameterId: paramMap['Turbidez'], unitId: unitMap['NTU'], minValue: 0, maxValue: 0.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - Torre de Resfriamento Data Center (System 10)
      { systemId: systemMap[10], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Condutividade', parameterId: paramMap['Condutividade'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Temperatura Entrada', parameterId: paramMap['Temperatura'], unitId: unitMap['°C'], minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Cloro Total', parameterId: paramMap['Cloro'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - ETE Corporativa (System 11)
      { systemId: systemMap[11], name: 'pH Entrada', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 5.0, maxValue: 9.0, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'pH Saída', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'DBO Saída', parameterId: paramMap['DBO'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 60, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'Turbidez Saída', parameterId: paramMap['Turbidez'], unitId: unitMap['NTU'], minValue: 0, maxValue: 5.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Insert Checklist Items
    await queryInterface.bulkInsert('ChecklistItems', [
      // CLIENT 1 - Piscina Principal (System 1)
      { systemId: systemMap[1], name: 'Verificar nível da água', description: 'Conferir se o nível está adequado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Limpar skimmers', description: 'Remover detritos dos skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Verificar bomba de circulação', description: 'Checar funcionamento e ruídos anormais', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Inspecionar filtros', description: 'Verificar pressão e necessidade de retrolavagem', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Pressão do filtro', description: 'Registrar pressão atual', isRequired: false, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Verificar dosadores químicos', description: 'Checar nível de produtos e funcionamento', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 1 - Piscina Infantil (System 2)
      { systemId: systemMap[2], name: 'Verificar nível da água', description: 'Conferir se o nível está adequado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Limpar skimmers', description: 'Remover detritos dos skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Verificar temperatura', description: 'Garantir temperatura adequada para crianças', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Inspecionar área ao redor', description: 'Verificar segurança da área', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 2 - Torre de Resfriamento 1 (System 3)
      { systemId: systemMap[3], name: 'Verificar vazamentos', description: 'Inspecionar toda a estrutura para vazamentos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Checar nível da bacia', description: 'Verificar nível de água na bacia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Inspecionar ventiladores', description: 'Verificar funcionamento e ruídos', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Verificar enchimento', description: 'Inspecionar condição do enchimento', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Checar purga automática', description: 'Verificar funcionamento do sistema de purga', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Verificar dosagem de biocida', description: 'Checar sistema de dosagem', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 2 - Torre de Resfriamento 2 (System 4)
      { systemId: systemMap[4], name: 'Verificar vazamentos', description: 'Inspecionar toda a estrutura para vazamentos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Checar nível da bacia', description: 'Verificar nível de água na bacia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Inspecionar ventiladores', description: 'Verificar funcionamento e ruídos', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Verificar enchimento', description: 'Inspecionar condição do enchimento', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - Caldeira (System 5)
      { systemId: systemMap[5], name: 'Verificar nível de água', description: 'Checar visores de nível', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Testar alarmes de nível', description: 'Realizar teste dos alarmes', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Verificar pressão de operação', description: 'Checar manômetros', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Pressão atual', description: 'Registrar pressão de operação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Inspecionar válvulas de segurança', description: 'Verificar condição das válvulas', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Verificar descarga de fundo', description: 'Realizar descarga de fundo se necessário', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Checar sistema de tratamento', description: 'Verificar abrandador e dosadores', isRequired: true, order: 7, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - ETA (System 6)
      { systemId: systemMap[6], name: 'Verificar coagulação', description: 'Checar formação de flocos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Inspecionar decantadores', description: 'Verificar acúmulo de lodo', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Verificar filtros', description: 'Checar necessidade de retrolavagem', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Checar dosagem de cloro', description: 'Verificar sistema de cloração', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Verificar reservatórios', description: 'Inspecionar nível e condições', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - ETE (System 7)
      { systemId: systemMap[7], name: 'Verificar grade de entrada', description: 'Limpar sólidos grosseiros', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Checar caixa de areia', description: 'Verificar acúmulo de areia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Inspecionar aeradores', description: 'Verificar funcionamento dos aeradores', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Verificar decantador secundário', description: 'Checar clarificação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Checar recirculação de lodo', description: 'Verificar bomba de recirculação', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Verificar descarte de lodo', description: 'Checar leito de secagem', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 3 - Efluentes Linha 1 (System 8)
      { systemId: systemMap[8], name: 'Verificar pH do efluente', description: 'Medir pH antes do tratamento', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Checar temperatura', description: 'Verificar temperatura do efluente', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Inspecionar tanque de equalização', description: 'Verificar nível e mistura', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Verificar sistema de dosagem', description: 'Checar bombas dosadoras', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - Piscina Aquecida (System 9)
      { systemId: systemMap[9], name: 'Verificar nível da água', description: 'Conferir se o nível está adequado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Verificar sistema de aquecimento', description: 'Checar temperatura e funcionamento do aquecedor', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Limpar skimmers', description: 'Remover detritos dos skimmers', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[9], name: 'Verificar bomba de circulação', description: 'Checar funcionamento e ruídos anormais', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - Torre de Resfriamento Data Center (System 10)
      { systemId: systemMap[10], name: 'Verificar vazamentos', description: 'Inspecionar toda a estrutura para vazamentos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Checar nível da bacia', description: 'Verificar nível de água na bacia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Inspecionar ventiladores', description: 'Verificar funcionamento e ruídos', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[10], name: 'Monitorar temperatura do data center', description: 'Garantir refrigeração adequada dos servidores', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // CLIENT 4 - ETE Corporativa (System 11)
      { systemId: systemMap[11], name: 'Verificar grade de entrada', description: 'Limpar sólidos grosseiros', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'Inspecionar reator biológico', description: 'Verificar funcionamento do reator', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'Verificar decantador', description: 'Checar clarificação do efluente', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[11], name: 'Checar qualidade do efluente', description: 'Verificar conformidade com padrões de lançamento', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // ETE (Client 3) - Stages Checklist Items
      { systemId: systemByName['Estação Elevatória'], name: 'Verificar bombas', description: 'Checar funcionamento das bombas submersas', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Estação Elevatória'], name: 'Inspecionar grade', description: 'Verificar limpeza da grade de retenção', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Estação Elevatória'], name: 'Checar nível do poço', description: 'Verificar nível de efluente no poço de sucção', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Estação Elevatória'], name: 'Verificar painel elétrico', description: 'Checar alarmes e funcionamento do painel', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Tanque de Aeração'], name: 'Verificar aeradores', description: 'Checar funcionamento dos aeradores superficiais', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Aeração'], name: 'Medir oxigênio dissolvido', description: 'Verificar nível de OD no tanque', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Aeração'], name: 'Observar características do lodo', description: 'Verificar cor, odor e formação de espuma', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Aeração'], name: 'Checar nível do tanque', description: 'Verificar nível de operação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Aeração'], name: 'Verificar mistura', description: 'Confirmar homogeneização do lodo ativado', isRequired: false, order: 5, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Decantador Secundário'], name: 'Verificar clarificação', description: 'Observar qualidade do efluente clarificado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador Secundário'], name: 'Checar manto de lodo', description: 'Verificar altura do manto de lodo', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador Secundário'], name: 'Inspecionar raspador', description: 'Verificar funcionamento do raspador de fundo', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador Secundário'], name: 'Verificar vertedor', description: 'Checar escoamento pelo vertedor', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador Secundário'], name: 'Checar bomba de retorno', description: 'Verificar bomba de recirculação de lodo', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Filtro de Polimento'], name: 'Verificar pressão diferencial', description: 'Checar perda de carga do filtro', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtro de Polimento'], name: 'Inspecionar meio filtrante', description: 'Verificar condição do leito filtrante', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtro de Polimento'], name: 'Verificar qualidade do filtrado', description: 'Avaliar turbidez do efluente filtrado', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtro de Polimento'], name: 'Checar necessidade de retrolavagem', description: 'Determinar se é necessário retrolavagem', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Tanque de Efluente Tratado'], name: 'Verificar nível', description: 'Checar nível do reservatório', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Efluente Tratado'], name: 'Inspecionar qualidade visual', description: 'Observar cor e turbidez do efluente', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Efluente Tratado'], name: 'Verificar sistema de desinfecção', description: 'Checar dosagem de cloro ou UV', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tanque de Efluente Tratado'], name: 'Checar ponto de lançamento', description: 'Verificar condições do ponto de descarte', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // ETA (Client 3) - Stages Checklist Items
      { systemId: systemByName['Captação'], name: 'Verificar bombas de captação', description: 'Checar funcionamento das bombas', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Captação'], name: 'Inspecionar grades', description: 'Verificar limpeza das grades', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Captação'], name: 'Verificar nível do manancial', description: 'Checar condições do manancial', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Captação'], name: 'Checar vazão de captação', description: 'Registrar vazão captada', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Floculador'], name: 'Verificar dosagem de coagulante', description: 'Checar dosagem de sulfato de alumínio', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Floculador'], name: 'Observar formação de flocos', description: 'Avaliar qualidade dos flocos formados', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Floculador'], name: 'Verificar agitadores', description: 'Checar funcionamento dos agitadores', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Floculador'], name: 'Checar pH de coagulação', description: 'Verificar pH ótimo para coagulação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Decantador'], name: 'Verificar clarificação', description: 'Observar qualidade da água clarificada', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador'], name: 'Inspecionar acúmulo de lodo', description: 'Verificar necessidade de descarte de lodo', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador'], name: 'Checar vertedores', description: 'Verificar distribuição uniforme nos vertedores', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador'], name: 'Verificar raspador', description: 'Checar funcionamento do raspador de lodo', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Filtros'], name: 'Verificar perda de carga', description: 'Checar pressão diferencial dos filtros', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtros'], name: 'Avaliar qualidade do filtrado', description: 'Medir turbidez da água filtrada', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtros'], name: 'Checar necessidade de retrolavagem', description: 'Determinar cronograma de retrolavagem', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filtros'], name: 'Inspecionar meio filtrante', description: 'Verificar condição da areia e antracito', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Reservatório de Água Tratada'], name: 'Verificar nível', description: 'Checar nível do reservatório', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Reservatório de Água Tratada'], name: 'Checar cloro residual', description: 'Medir cloro residual livre', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Reservatório de Água Tratada'], name: 'Verificar fluoretação', description: 'Checar dosagem de flúor se aplicável', isRequired: false, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Reservatório de Água Tratada'], name: 'Inspecionar estrutura', description: 'Verificar condição física do reservatório', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // ETE Corporativa (Client 4) - Stages Checklist Items
      { systemId: systemByName['Tratamento Preliminar'], name: 'Limpar grade de retenção', description: 'Remover sólidos grosseiros', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tratamento Preliminar'], name: 'Verificar caixa de areia', description: 'Checar acúmulo de areia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Tratamento Preliminar'], name: 'Inspecionar bombas', description: 'Verificar funcionamento das bombas', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Reator Biológico'], name: 'Verificar aeração', description: 'Checar sistema de aeração', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Reator Biológico'], name: 'Medir OD', description: 'Verificar oxigênio dissolvido', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Reator Biológico'], name: 'Observar lodo ativado', description: 'Verificar características do lodo', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },

      { systemId: systemByName['Decantador'], name: 'Verificar clarificação', description: 'Observar qualidade do efluente clarificado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador'], name: 'Checar descarte de lodo', description: 'Verificar sistema de descarte', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Decantador'], name: 'Inspecionar efluente final', description: 'Verificar qualidade antes do lançamento', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Reset sequences to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Systems"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Systems"), 0),
        true
      );
    `);
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"MonitoringPoints"', 'id'),
        COALESCE((SELECT MAX(id) FROM "MonitoringPoints"), 0),
        true
      );
    `);
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ChecklistItems"', 'id'),
        COALESCE((SELECT MAX(id) FROM "ChecklistItems"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ChecklistItems', null, {});
    await queryInterface.bulkDelete('MonitoringPoints', null, {});
    await queryInterface.bulkDelete('Systems', null, {});
  }
};
