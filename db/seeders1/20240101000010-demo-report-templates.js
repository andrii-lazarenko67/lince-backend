'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ReportTemplates', [
      {
        id: 1,
        userId: 1,
        name: 'Monthly WWTP Report',
        description: 'Standard template for monthly Wastewater Treatment Plant reports',
        config: JSON.stringify({
          blocks: [
            { type: 'systems', enabled: true, order: 1 },
            { type: 'dailyLogs', enabled: true, order: 2 },
            { type: 'inspections', enabled: true, order: 3 },
            { type: 'incidents', enabled: true, order: 4 }
          ],
          period: 'monthly',
          includeCharts: true,
          includePhotos: true
        }),
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        name: 'Weekly Pool Report',
        description: 'Template for weekly swimming pool maintenance reports',
        config: JSON.stringify({
          blocks: [
            { type: 'systems', enabled: true, order: 1 },
            { type: 'dailyLogs', enabled: true, order: 2 },
            { type: 'inspections', enabled: true, order: 3 }
          ],
          period: 'weekly',
          includeCharts: true,
          includePhotos: true
        }),
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        userId: 1,
        name: 'Incident Report',
        description: 'Template focused on incidents and occurrences',
        config: JSON.stringify({
          blocks: [
            { type: 'systems', enabled: true, order: 1 },
            { type: 'incidents', enabled: true, order: 2 }
          ],
          period: 'custom',
          includeCharts: false,
          includePhotos: true
        }),
        isDefault: false,
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
