'use strict';

/**
 * Migration: Reset global report templates to the 4 standard ones.
 * Deactivates any existing global templates and upserts the 4 required defaults.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Deactivate all current global templates
    await queryInterface.bulkUpdate(
      'ReportTemplates',
      { isActive: false },
      { isGlobal: true }
    );

    const branding = {
      showLogo: true,
      logoPosition: 'left',
      primaryColor: '#1976d2',
      showHeader: true,
      headerText: 'Relatório Técnico',
      showFooter: true,
      footerText: 'Página {page} de {pages}'
    };

    const defaultInspectionsBlock = {
      type: 'inspections',
      enabled: true,
      includePhotos: true,
      showInspectionOverview: true,
      showInspectionDetailed: true,
      highlightOnlyNonConformities: false
    };

    const defaultOccurrencesBlock = {
      type: 'occurrences',
      enabled: true,
      includeTimeline: true,
      includePhotos: true,
      includeComments: true,
      showOccurrenceOverview: true,
      showOccurrenceDetailed: true,
      showOnlyHighestCriticality: false,
      criticalityFilter: 'all'
    };

    const now = new Date();

    // Insert the 4 standard global templates
    await queryInterface.bulkInsert('ReportTemplates', [
      {
        userId: 1,
        clientId: null,
        name: 'Relatório Plus',
        description: 'Relatório completo contendo todos os registros do sistema, incluindo análises com gráficos, inspeções, ocorrências e registros fotográficos.',
        type: 'both',
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: true },
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true, showFieldOverview: true, showFieldDetailed: true, showLaboratoryOverview: true, showLaboratoryDetailed: true },
            { ...defaultInspectionsBlock, order: 5 },
            { ...defaultOccurrencesBlock, order: 6 },
            { type: 'conclusion', enabled: true, order: 7 },
            { type: 'signature', enabled: true, order: 8 }
          ],
          branding
        }),
        isDefault: true,
        isGlobal: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 1,
        clientId: null,
        name: 'Relatório Analítico',
        description: 'Relatório contendo os registros das análises realizadas em campo e em laboratório, apresentado em visão geral e detalhada, incluindo gráficos para melhor visualização e interpretação dos resultados.',
        type: 'both',
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: true, order: 3, includePhotos: false },
            { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true, showFieldOverview: true, showFieldDetailed: true, showLaboratoryOverview: true, showLaboratoryDetailed: true },
            { type: 'inspections', enabled: false, order: 5 },
            { type: 'occurrences', enabled: false, order: 6 },
            { type: 'conclusion', enabled: true, order: 7 },
            { type: 'signature', enabled: true, order: 8 }
          ],
          branding: { ...branding, headerText: 'Relatório Analítico' }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 1,
        clientId: null,
        name: 'Relatório de Inspeções',
        description: 'Relatório contendo os registros das inspeções realizadas, incluindo fotos, observações e comentários técnicos.',
        type: 'both',
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: false, order: 3 },
            { type: 'analyses', enabled: false, order: 4 },
            { ...defaultInspectionsBlock, order: 5 },
            { type: 'occurrences', enabled: false, order: 6 },
            { type: 'conclusion', enabled: true, order: 7 },
            { type: 'signature', enabled: true, order: 8 }
          ],
          branding: { ...branding, headerText: 'Relatório de Inspeções' }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        userId: 1,
        clientId: null,
        name: 'Relatório de Ocorrências',
        description: 'Relatório contendo todas as ocorrências registradas, incluindo fotos, visão geral e detalhada, além da linha do tempo dos acontecimentos.',
        type: 'both',
        config: JSON.stringify({
          blocks: [
            { type: 'identification', enabled: true, order: 1 },
            { type: 'scope', enabled: true, order: 2 },
            { type: 'systems', enabled: false, order: 3 },
            { type: 'analyses', enabled: false, order: 4 },
            { type: 'inspections', enabled: false, order: 5 },
            { ...defaultOccurrencesBlock, order: 6 },
            { type: 'conclusion', enabled: true, order: 7 },
            { type: 'signature', enabled: true, order: 8 }
          ],
          branding: { ...branding, headerText: 'Relatório de Ocorrências' }
        }),
        isDefault: false,
        isGlobal: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
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
    // Deactivate the 4 templates added by this migration
    await queryInterface.bulkUpdate(
      'ReportTemplates',
      { isActive: false },
      {
        isGlobal: true,
        name: ['Relatório Plus', 'Relatório Analítico', 'Relatório de Inspeções', 'Relatório de Ocorrências']
      }
    );
  }
};
