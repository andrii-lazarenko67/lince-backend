'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert Systems
    await queryInterface.bulkInsert('Systems', [
      {
        name: 'Piscina Principal - Hotel Sunset',
        type: 'pool',
        location: 'Área de Lazer - Bloco A',
        description: 'Piscina principal do hotel com capacidade de 500.000 litros. Uso recreativo.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Piscina Infantil - Hotel Sunset',
        type: 'pool',
        location: 'Área de Lazer - Bloco A',
        description: 'Piscina infantil com profundidade máxima de 60cm.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Torre de Resfriamento - Unidade 1',
        type: 'cooling_tower',
        location: 'Área Industrial - Setor B',
        description: 'Torre de resfriamento principal para sistema de ar condicionado central.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Torre de Resfriamento - Unidade 2',
        type: 'cooling_tower',
        location: 'Área Industrial - Setor B',
        description: 'Torre de resfriamento secundária de backup.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Caldeira a Vapor - Principal',
        type: 'boiler',
        location: 'Casa de Máquinas',
        description: 'Caldeira principal para geração de vapor industrial. Capacidade: 10 ton/h.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ETA - Estação de Tratamento',
        type: 'wtp',
        location: 'Área de Utilidades',
        description: 'Estação de tratamento de água para abastecimento industrial.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ETE - Tratamento de Efluentes',
        type: 'wwtp',
        location: 'Área de Utilidades - Fundos',
        description: 'Estação de tratamento de efluentes industriais antes do descarte.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sistema de Efluentes - Linha 1',
        type: 'effluent',
        location: 'Área de Produção',
        description: 'Sistema de coleta e tratamento de efluentes da linha de produção 1.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insert Monitoring Points
    await queryInterface.bulkInsert('MonitoringPoints', [
      // Piscina Principal (System 1)
      { systemId: 1, name: 'pH da Água', parameter: 'pH', unit: '', minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Cloro Residual Livre', parameter: 'Cloro', unit: 'mg/L', minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Temperatura', parameter: 'Temperatura', unit: '°C', minValue: 24, maxValue: 30, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Turbidez', parameter: 'Turbidez', unit: 'NTU', minValue: 0, maxValue: 0.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Alcalinidade Total', parameter: 'Alcalinidade', unit: 'mg/L', minValue: 80, maxValue: 120, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // Piscina Infantil (System 2)
      { systemId: 2, name: 'pH da Água', parameter: 'pH', unit: '', minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 2, name: 'Cloro Residual Livre', parameter: 'Cloro', unit: 'mg/L', minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 2, name: 'Temperatura', parameter: 'Temperatura', unit: '°C', minValue: 26, maxValue: 32, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Torre de Resfriamento 1 (System 3)
      { systemId: 3, name: 'pH', parameter: 'pH', unit: '', minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Condutividade', parameter: 'Condutividade', unit: 'µS/cm', minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Temperatura Entrada', parameter: 'Temperatura', unit: '°C', minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Temperatura Saída', parameter: 'Temperatura', unit: '°C', minValue: 15, maxValue: 35, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Cloro Total', parameter: 'Cloro', unit: 'mg/L', minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Ciclos de Concentração', parameter: 'Ciclos', unit: '', minValue: 3, maxValue: 6, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Torre de Resfriamento 2 (System 4)
      { systemId: 4, name: 'pH', parameter: 'pH', unit: '', minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Condutividade', parameter: 'Condutividade', unit: 'µS/cm', minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Temperatura Entrada', parameter: 'Temperatura', unit: '°C', minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Cloro Total', parameter: 'Cloro', unit: 'mg/L', minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Caldeira (System 5)
      { systemId: 5, name: 'pH da Água de Alimentação', parameter: 'pH', unit: '', minValue: 8.5, maxValue: 9.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Condutividade', parameter: 'Condutividade', unit: 'µS/cm', minValue: 0, maxValue: 3500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Dureza Total', parameter: 'Dureza', unit: 'mg/L CaCO3', minValue: 0, maxValue: 5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Sílica', parameter: 'Sílica', unit: 'mg/L', minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Oxigênio Dissolvido', parameter: 'OD', unit: 'mg/L', minValue: 0, maxValue: 0.007, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Ferro Total', parameter: 'Ferro', unit: 'mg/L', minValue: 0, maxValue: 0.1, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Alcalinidade', parameter: 'Alcalinidade', unit: 'mg/L', minValue: 200, maxValue: 700, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // ETA (System 6)
      { systemId: 6, name: 'pH Entrada', parameter: 'pH', unit: '', minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'pH Saída', parameter: 'pH', unit: '', minValue: 6.5, maxValue: 8.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Turbidez Entrada', parameter: 'Turbidez', unit: 'NTU', minValue: 0, maxValue: 100, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Turbidez Saída', parameter: 'Turbidez', unit: 'NTU', minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Cloro Residual', parameter: 'Cloro', unit: 'mg/L', minValue: 0.5, maxValue: 2.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Cor Aparente', parameter: 'Cor', unit: 'uH', minValue: 0, maxValue: 15, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // ETE (System 7)
      { systemId: 7, name: 'pH Entrada', parameter: 'pH', unit: '', minValue: 5.0, maxValue: 9.0, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'pH Saída', parameter: 'pH', unit: '', minValue: 5.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'DBO Entrada', parameter: 'DBO', unit: 'mg/L', minValue: 0, maxValue: 500, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'DBO Saída', parameter: 'DBO', unit: 'mg/L', minValue: 0, maxValue: 60, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'DQO Saída', parameter: 'DQO', unit: 'mg/L', minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Sólidos Sedimentáveis', parameter: 'SS', unit: 'mL/L', minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Oxigênio Dissolvido', parameter: 'OD', unit: 'mg/L', minValue: 2.0, maxValue: 8.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Efluentes Linha 1 (System 8)
      { systemId: 8, name: 'pH', parameter: 'pH', unit: '', minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 8, name: 'Temperatura', parameter: 'Temperatura', unit: '°C', minValue: 15, maxValue: 40, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 8, name: 'Vazão', parameter: 'Vazão', unit: 'm³/h', minValue: 0, maxValue: 50, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Insert Checklist Items
    await queryInterface.bulkInsert('ChecklistItems', [
      // Piscina Principal (System 1)
      { systemId: 1, name: 'Verificar nível da água', description: 'Conferir se o nível está adequado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Limpar skimmers', description: 'Remover detritos dos skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Verificar bomba de circulação', description: 'Checar funcionamento e ruídos anormais', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Inspecionar filtros', description: 'Verificar pressão e necessidade de retrolavagem', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Pressão do filtro', description: 'Registrar pressão atual', isRequired: false, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 1, name: 'Verificar dosadores químicos', description: 'Checar nível de produtos e funcionamento', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Piscina Infantil (System 2)
      { systemId: 2, name: 'Verificar nível da água', description: 'Conferir se o nível está adequado', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 2, name: 'Limpar skimmers', description: 'Remover detritos dos skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 2, name: 'Verificar temperatura', description: 'Garantir temperatura adequada para crianças', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 2, name: 'Inspecionar área ao redor', description: 'Verificar segurança da área', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // Torre de Resfriamento 1 (System 3)
      { systemId: 3, name: 'Verificar vazamentos', description: 'Inspecionar toda a estrutura para vazamentos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Checar nível da bacia', description: 'Verificar nível de água na bacia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Inspecionar ventiladores', description: 'Verificar funcionamento e ruídos', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Verificar enchimento', description: 'Inspecionar condição do enchimento', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Checar purga automática', description: 'Verificar funcionamento do sistema de purga', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 3, name: 'Verificar dosagem de biocida', description: 'Checar sistema de dosagem', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Torre de Resfriamento 2 (System 4)
      { systemId: 4, name: 'Verificar vazamentos', description: 'Inspecionar toda a estrutura para vazamentos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Checar nível da bacia', description: 'Verificar nível de água na bacia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Inspecionar ventiladores', description: 'Verificar funcionamento e ruídos', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 4, name: 'Verificar enchimento', description: 'Inspecionar condição do enchimento', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // Caldeira (System 5)
      { systemId: 5, name: 'Verificar nível de água', description: 'Checar visores de nível', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Testar alarmes de nível', description: 'Realizar teste dos alarmes', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Verificar pressão de operação', description: 'Checar manômetros', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Pressão atual', description: 'Registrar pressão de operação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Inspecionar válvulas de segurança', description: 'Verificar condição das válvulas', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Verificar descarga de fundo', description: 'Realizar descarga de fundo se necessário', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 5, name: 'Checar sistema de tratamento', description: 'Verificar abrandador e dosadores', isRequired: true, order: 7, createdAt: new Date(), updatedAt: new Date() },

      // ETA (System 6)
      { systemId: 6, name: 'Verificar coagulação', description: 'Checar formação de flocos', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Inspecionar decantadores', description: 'Verificar acúmulo de lodo', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Verificar filtros', description: 'Checar necessidade de retrolavagem', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Checar dosagem de cloro', description: 'Verificar sistema de cloração', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 6, name: 'Verificar reservatórios', description: 'Inspecionar nível e condições', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },

      // ETE (System 7)
      { systemId: 7, name: 'Verificar grade de entrada', description: 'Limpar sólidos grosseiros', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Checar caixa de areia', description: 'Verificar acúmulo de areia', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Inspecionar aeradores', description: 'Verificar funcionamento dos aeradores', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Verificar decantador secundário', description: 'Checar clarificação', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Checar recirculação de lodo', description: 'Verificar bomba de recirculação', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 7, name: 'Verificar descarte de lodo', description: 'Checar leito de secagem', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Efluentes Linha 1 (System 8)
      { systemId: 8, name: 'Verificar pH do efluente', description: 'Medir pH antes do tratamento', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 8, name: 'Checar temperatura', description: 'Verificar temperatura do efluente', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 8, name: 'Inspecionar tanque de equalização', description: 'Verificar nível e mistura', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: 8, name: 'Verificar sistema de dosagem', description: 'Checar bombas dosadoras', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ChecklistItems', null, {});
    await queryInterface.bulkDelete('MonitoringPoints', null, {});
    await queryInterface.bulkDelete('Systems', null, {});
  }
};
