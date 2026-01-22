'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ReportTemplates', [
      // Global templates (isGlobal: true, clientId: null)
      {
        id: 1,
        userId: 1,
        clientId: null,
        name: 'Monthly WWTP Report',
        description: 'Standard template for monthly Wastewater Treatment Plant reports',
        type: 'both',
        systemTypeIds: JSON.stringify([5]), // WWTP only
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
            headerText: 'Technical Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
        name: 'Monthly WTP Report',
        description: 'Standard template for monthly Water Treatment Plant reports',
        type: 'both',
        systemTypeIds: JSON.stringify([4]), // WTP only
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
            headerText: 'Technical Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
        name: 'Pool Visit Report',
        description: 'Template for swimming pool technical visit reports',
        type: 'service_provider',
        systemTypeIds: JSON.stringify([1]), // Pool only
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
            headerText: 'Technical Visit Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
        name: 'Cooling Tower Report',
        description: 'Template for industrial cooling tower reports',
        type: 'both',
        systemTypeIds: JSON.stringify([2]), // Cooling Tower only
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
            headerText: 'Technical Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
        name: 'Boiler Report',
        description: 'Template for industrial boiler reports',
        type: 'both',
        systemTypeIds: JSON.stringify([3]), // Boiler only
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
            headerText: 'Technical Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
        name: 'Incident Report',
        description: 'Template focused on incidents and occurrences',
        type: 'both',
        systemTypeIds: null, // General template - show for all clients
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
            headerText: 'Incident Report',
            showFooter: true,
            footerText: 'Page {page} of {pages}'
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
