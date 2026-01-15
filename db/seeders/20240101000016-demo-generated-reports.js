'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Fetch users for report ownership
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Fetch clients
    const clients = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Clients" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Fetch systems with their clientIds
    const systems = await queryInterface.sequelize.query(
      'SELECT id, name, "clientId" FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Fetch report templates
    const templates = await queryInterface.sequelize.query(
      'SELECT id, name, config FROM "ReportTemplates" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'manager@lince.com') userMap.manager = user.id;
      else if (user.email === 'technician@lince.com') userMap.technician = user.id;
      else if (user.email === 'cliente@endcustomer.com') userMap.endcustomer = user.id;
    });

    // Create client lookup
    const clientMap = {};
    clients.forEach((client, index) => {
      clientMap[index + 1] = client.id;
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name.includes('Piscina Principal')) systemMap.piscina = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('Torre de Resfriamento - Unidade 1')) systemMap.torre = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('Caldeira')) systemMap.caldeira = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('ETA')) systemMap.eta = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('ETE - Tratamento')) systemMap.ete = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('Piscina Aquecida')) systemMap.piscinaClient4 = { id: system.id, clientId: system.clientId };
      else if (system.name.includes('Data Center')) systemMap.torreClient4 = { id: system.id, clientId: system.clientId };
    });

    // Define chart color palettes for different parameter types
    const chartColors = {
      ph: { primary: '#4CAF50', secondary: '#81C784' },           // Green for pH
      cloro: { primary: '#2196F3', secondary: '#64B5F6' },        // Blue for Chlorine
      temperatura: { primary: '#FF9800', secondary: '#FFB74D' },  // Orange for Temperature
      turbidez: { primary: '#9C27B0', secondary: '#BA68C8' },     // Purple for Turbidity
      condutividade: { primary: '#795548', secondary: '#A1887F' }, // Brown for Conductivity
      dbo: { primary: '#607D8B', secondary: '#90A4AE' },          // Blue-grey for DBO
      dqo: { primary: '#F44336', secondary: '#E57373' },          // Red for DQO
      default: { primary: '#1976d2', secondary: '#42a5f5' }       // Default blue
    };

    // Helper function to create chart config for a report
    const createChartConfig = (chartType, aggregation, selectedMonitoringPointIds = []) => ({
      chartType: chartType, // 'bar' | 'line' | 'area'
      aggregation: aggregation, // 'daily' | 'weekly' | 'monthly'
      showLegend: true,
      showSpecLimits: true,
      highlightOutOfRange: true,
      selectedMonitoringPointIds: selectedMonitoringPointIds,
      colors: chartColors.default
    });

    // Create Generated Reports with various chart configurations
    const generatedReports = [
      // ===== CLIENT 1: Hotel - Pool Reports =====
      {
        templateId: templates[2]?.id || 3, // Relatório de Visita Piscina
        userId: userMap.technician,
        clientId: systemMap.piscina?.clientId || clientMap[1],
        name: 'Relatório Mensal - Piscina Principal - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.piscina?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(30),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field', 'laboratory']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: true,
              // Field chart config - BAR chart for daily measurements
              fieldChartConfig: {
                ...createChartConfig('bar', 'daily'),
                title: 'Parâmetros de Campo - Últimos 30 dias',
                colors: chartColors.cloro
              },
              // Laboratory chart config - LINE chart for weekly lab results
              laboratoryChartConfig: {
                ...createChartConfig('line', 'weekly'),
                title: 'Análises Laboratoriais - Últimas 4 semanas',
                colors: chartColors.ph
              }
            },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'conclusion', enabled: true, order: 6 },
            { type: 'signature', enabled: true, order: 7 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#0288d1',
            showHeader: true,
            headerText: 'Relatório de Visita Técnica - Piscina',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-piscina-jan-2026',
        generatedAt: new Date(getDate(1)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 2: Condominium - Cooling Tower Report =====
      {
        templateId: templates[3]?.id || 4, // Relatório Torre de Resfriamento
        userId: userMap.manager,
        clientId: systemMap.torre?.clientId || clientMap[2],
        name: 'Relatório Semanal - Torre de Resfriamento - Semana 2',
        systemIds: JSON.stringify([systemMap.torre?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(14),
          end: getDate(7)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: false,
              showLaboratoryDetailed: false,
              // Field chart config - AREA chart for temperature trends
              fieldChartConfig: {
                ...createChartConfig('area', 'daily'),
                title: 'Tendência de Temperatura e Condutividade',
                colors: chartColors.temperatura
              }
            },
            { type: 'occurrences', enabled: true, order: 5, includeTimeline: true },
            { type: 'conclusion', enabled: true, order: 6 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#ff5722',
            showHeader: true,
            headerText: 'Relatório Técnico - Torre de Resfriamento',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-torre-sem2-2026',
        generatedAt: new Date(getDate(7)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 3: Industry - ETE Report with AREA chart =====
      {
        templateId: templates[0]?.id || 1, // Relatório Mensal ETE
        userId: userMap.technician,
        clientId: systemMap.ete?.clientId || clientMap[3],
        name: 'Relatório Mensal ETE - Dezembro 2025',
        systemIds: JSON.stringify([systemMap.ete?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(60),
          end: getDate(30)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field', 'laboratory']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: true,
              // Field chart config - AREA chart for DBO/DQO trends
              fieldChartConfig: {
                ...createChartConfig('area', 'weekly'),
                title: 'Evolução DBO/DQO - Campo',
                colors: chartColors.dbo
              },
              // Laboratory chart config - BAR chart for comparison
              laboratoryChartConfig: {
                ...createChartConfig('bar', 'weekly'),
                title: 'Análises Laboratoriais - DBO/DQO',
                colors: chartColors.dqo
              }
            },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'conclusion', enabled: true, order: 6 },
            { type: 'signature', enabled: true, order: 7 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#1976d2',
            showHeader: true,
            headerText: 'Relatório Técnico - ETE',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-ete-dez-2025',
        generatedAt: new Date(getDate(30)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 3: Industry - ETA Report with LINE chart =====
      {
        templateId: templates[1]?.id || 2, // Relatório Mensal ETA
        userId: userMap.technician,
        clientId: systemMap.eta?.clientId || clientMap[3],
        name: 'Relatório Mensal ETA - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.eta?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(30),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field', 'laboratory']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: true,
              // Field chart config - LINE chart for turbidity trends
              fieldChartConfig: {
                ...createChartConfig('line', 'daily'),
                title: 'Tendência de Turbidez e Cloro',
                colors: chartColors.turbidez
              },
              // Laboratory chart config - LINE chart for potability analysis
              laboratoryChartConfig: {
                ...createChartConfig('line', 'weekly'),
                title: 'Análises de Potabilidade',
                colors: chartColors.cloro
              }
            },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'conclusion', enabled: true, order: 6 },
            { type: 'signature', enabled: true, order: 7 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#1976d2',
            showHeader: true,
            headerText: 'Relatório Técnico - ETA',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-eta-jan-2026',
        generatedAt: new Date(getDate(2)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 3: Industry - Caldeira Report with BAR chart =====
      {
        templateId: templates[4]?.id || 5, // Relatório Caldeira
        userId: userMap.manager,
        clientId: systemMap.caldeira?.clientId || clientMap[3],
        name: 'Relatório Quinzenal - Caldeira - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.caldeira?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(15),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field', 'laboratory']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: false,
              // Field chart config - BAR chart for daily boiler parameters
              fieldChartConfig: {
                ...createChartConfig('bar', 'daily'),
                title: 'Parâmetros da Caldeira - Últimos 15 dias',
                colors: chartColors.condutividade
              },
              // Laboratory chart config - AREA chart for trend analysis
              laboratoryChartConfig: {
                ...createChartConfig('area', 'weekly'),
                title: 'Análises Laboratoriais - Tendência',
                colors: chartColors.ph
              }
            },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'conclusion', enabled: true, order: 6 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#d32f2f',
            showHeader: true,
            headerText: 'Relatório Técnico - Caldeira',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-caldeira-jan-2026',
        generatedAt: new Date(getDate(0)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 4: End Customer - Pool Report (Self-service) =====
      {
        templateId: templates[6]?.id || 7, // Relatório de Análises Piscina
        userId: userMap.endcustomer,
        clientId: systemMap.piscinaClient4?.clientId || clientMap[4],
        name: 'Relatório de Análises - Piscina Aquecida - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.piscinaClient4?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(20),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: false,
          includeCharts: true,
          recordTypes: ['field']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            {
              type: 'analyses',
              enabled: true,
              order: 3,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: false,
              showLaboratoryOverview: false,
              showLaboratoryDetailed: false,
              // Field chart config - AREA chart for temperature trends (heated pool)
              fieldChartConfig: {
                ...createChartConfig('area', 'daily'),
                title: 'Temperatura e Qualidade da Água',
                colors: chartColors.temperatura
              }
            },
            { type: 'conclusion', enabled: true, order: 4 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'center',
            primaryColor: '#0288d1',
            showHeader: true,
            headerText: 'Relatório de Análises - Piscina',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-piscina-cliente4-jan-2026',
        generatedAt: new Date(getDate(1)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== CLIENT 4: End Customer - Data Center Cooling Tower =====
      {
        templateId: templates[3]?.id || 4, // Relatório Torre de Resfriamento
        userId: userMap.manager,
        clientId: systemMap.torreClient4?.clientId || clientMap[4],
        name: 'Relatório Crítico - Torre Data Center - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.torreClient4?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(25),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: false,
              showLaboratoryDetailed: false,
              // Field chart config - LINE chart for critical monitoring
              fieldChartConfig: {
                ...createChartConfig('line', 'daily'),
                title: 'Monitoramento Crítico - Temperatura Data Center',
                colors: chartColors.temperatura
              }
            },
            { type: 'occurrences', enabled: true, order: 5, includeTimeline: true },
            { type: 'conclusion', enabled: true, order: 6 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#ff5722',
            showHeader: true,
            headerText: 'Relatório Crítico - Data Center',
            showFooter: true,
            footerText: 'CONFIDENCIAL - Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-datacenter-jan-2026',
        generatedAt: new Date(getDate(0)),
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ===== Multi-system Report - Testing multiple chart series =====
      {
        templateId: templates[0]?.id || 1, // Relatório Mensal ETE
        userId: userMap.manager,
        clientId: systemMap.ete?.clientId || clientMap[3],
        name: 'Relatório Consolidado - ETE + Efluentes - Janeiro 2026',
        systemIds: JSON.stringify([systemMap.ete?.id, systemMap.eta?.id].filter(Boolean)),
        period: JSON.stringify({
          start: getDate(30),
          end: getDate(0)
        }),
        filters: JSON.stringify({
          includeAlerts: true,
          includePhotos: true,
          includeCharts: true,
          recordTypes: ['field', 'laboratory']
        }),
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            {
              type: 'analyses',
              enabled: true,
              order: 4,
              includeCharts: true,
              highlightAlerts: true,
              showFieldOverview: true,
              showFieldDetailed: true,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: true,
              // Field chart config - AREA chart showing multiple parameters
              fieldChartConfig: {
                ...createChartConfig('area', 'daily'),
                title: 'Parâmetros de Campo - Múltiplos Sistemas',
                colors: chartColors.default,
                showMultipleSeries: true
              },
              // Laboratory chart config - BAR chart for comparison
              laboratoryChartConfig: {
                ...createChartConfig('bar', 'weekly'),
                title: 'Análises Laboratoriais Consolidadas',
                colors: chartColors.dbo,
                showMultipleSeries: true
              }
            },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'conclusion', enabled: true, order: 6 },
            { type: 'signature', enabled: true, order: 7 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#1976d2',
            showHeader: true,
            headerText: 'Relatório Técnico Consolidado',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        pdfUrl: null,
        publicId: 'report-consolidado-jan-2026',
        generatedAt: new Date(getDate(0)),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('GeneratedReports', generatedReports, {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"GeneratedReports"', 'id'),
        COALESCE((SELECT MAX(id) FROM "GeneratedReports"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GeneratedReports', null, {});
  }
};
