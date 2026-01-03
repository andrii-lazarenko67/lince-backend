'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
            { type: 'inspections', enabled: true, order: 5, includePhotos: true },
            { type: 'occurrences', enabled: true, order: 6, includeTimeline: true },
            { type: 'conclusion', enabled: true, order: 7 },
            { type: 'signature', enabled: true, order: 8 }
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
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
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
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
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
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
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
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
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
        name: 'Relatório de Ocorrências',
        description: 'Modelo focado em ocorrências e incidentes',
        type: 'both',
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3 },
            { type: 'occurrences', enabled: true, order: 4, includeTimeline: true },
            { type: 'conclusion', enabled: true, order: 5 },
            { type: 'signature', enabled: true, order: 6 }
          ],
          branding: {
            showLogo: true,
            logoPosition: 'left',
            primaryColor: '#f57c00',
            showHeader: true,
            headerText: 'Relatório de Ocorrências',
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
