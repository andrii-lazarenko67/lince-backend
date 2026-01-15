'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Define chart color palettes for different system types
    const chartColors = {
      ete: { primary: '#607D8B', secondary: '#90A4AE' },           // Blue-grey for ETE
      eta: { primary: '#2196F3', secondary: '#64B5F6' },           // Blue for ETA
      piscina: { primary: '#0288d1', secondary: '#4FC3F7' },       // Light blue for Pool
      torre: { primary: '#ff5722', secondary: '#FF8A65' },         // Orange for Cooling Tower
      caldeira: { primary: '#d32f2f', secondary: '#E57373' },      // Red for Boiler
      default: { primary: '#1976d2', secondary: '#42a5f5' }        // Default blue
    };

    await queryInterface.bulkInsert('ReportTemplates', [
      // Global templates (isGlobal: true, clientId: null)
      {
        id: 1,
        userId: 1,
        clientId: null,
        name: 'Relatório Mensal ETE',
        description: 'Modelo padrão para relatórios mensais de Estação de Tratamento de Esgoto',
        type: 'both',
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
              // Field chart config - AREA chart for DBO/DQO trends
              fieldChartConfig: {
                chartType: 'area',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.ete
              },
              // Laboratory chart config - BAR chart for comparison
              laboratoryChartConfig: {
                chartType: 'bar',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.ete
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
            headerText: 'Relatório Técnico',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: true,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        clientId: null,
        name: 'Relatório Mensal ETA',
        description: 'Modelo padrão para relatórios mensais de Estação de Tratamento de Água',
        type: 'both',
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
              // Field chart config - LINE chart for turbidity/chlorine trends
              fieldChartConfig: {
                chartType: 'line',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.eta
              },
              // Laboratory chart config - LINE chart for potability analysis
              laboratoryChartConfig: {
                chartType: 'line',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.eta
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
            headerText: 'Relatório Técnico',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        userId: 1,
        clientId: null,
        name: 'Relatório de Visita Piscina',
        description: 'Modelo para relatórios de visita técnica em piscinas',
        type: 'service_provider',
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
              // Field chart config - BAR chart for daily pool measurements
              fieldChartConfig: {
                chartType: 'bar',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
              },
              // Laboratory chart config - LINE chart for lab analysis trends
              laboratoryChartConfig: {
                chartType: 'line',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
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
            headerText: 'Relatório de Visita Técnica',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        userId: 1,
        clientId: null,
        name: 'Relatório Torre de Resfriamento',
        description: 'Modelo para relatórios de torre de resfriamento industrial',
        type: 'both',
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
              // Field chart config - AREA chart for temperature/conductivity trends
              fieldChartConfig: {
                chartType: 'area',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.torre
              },
              // Laboratory chart config - BAR chart for Legionella/biocide analysis
              laboratoryChartConfig: {
                chartType: 'bar',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.torre
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
            headerText: 'Relatório Técnico',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        userId: 1,
        clientId: null,
        name: 'Relatório Caldeira',
        description: 'Modelo para relatórios de caldeira industrial',
        type: 'both',
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
                chartType: 'bar',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.caldeira
              },
              // Laboratory chart config - AREA chart for trend analysis
              laboratoryChartConfig: {
                chartType: 'area',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.caldeira
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
            headerText: 'Relatório Técnico',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        userId: 1,
        clientId: null,
        name: 'Relatório de Manutenção Piscina',
        description: 'Modelo para relatórios de manutenção em piscinas',
        type: 'both',
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
              showFieldDetailed: false,
              showLaboratoryOverview: true,
              showLaboratoryDetailed: false,
              // Field chart config - LINE chart for maintenance trends
              fieldChartConfig: {
                chartType: 'line',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
              },
              // Laboratory chart config - BAR chart for water quality comparison
              laboratoryChartConfig: {
                chartType: 'bar',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
              }
            },
            { type: 'occurrences', enabled: true, order: 5, includeTimeline: true },
            { type: 'conclusion', enabled: true, order: 6 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#0288d1',
            showHeader: true,
            headerText: 'Relatório de Manutenção',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        userId: 1,
        clientId: null,
        name: 'Relatório de Análises Piscina',
        description: 'Modelo para relatórios de análises laboratoriais em piscinas',
        type: 'both',
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
              showLaboratoryOverview: true,
              showLaboratoryDetailed: true,
              // Field chart config - AREA chart for temperature trends (heated pool)
              fieldChartConfig: {
                chartType: 'area',
                aggregation: 'daily',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
              },
              // Laboratory chart config - LINE chart for analysis trends
              laboratoryChartConfig: {
                chartType: 'line',
                aggregation: 'weekly',
                showLegend: true,
                showSpecLimits: true,
                highlightOutOfRange: true,
                colors: chartColors.piscina
              }
            },
            { type: 'conclusion', enabled: true, order: 4 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#0288d1',
            showHeader: true,
            headerText: 'Relatório de Análises',
            showFooter: true,
            footerText: 'Página {page} de {pages}'
          }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ReportTemplates"', 'id'),
        COALESCE((SELECT MAX(id) FROM "ReportTemplates"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReportTemplates', null, {});
  }
};
