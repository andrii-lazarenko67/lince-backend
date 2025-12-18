'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('SystemTypes', [
      {
        id: 1,
        name: 'Pool',
        description: 'Swimming pool system for recreational or therapeutic use',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Cooling Tower',
        description: 'Cooling tower system for central air conditioning',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Boiler',
        description: 'Boiler system for steam generation',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'WTP',
        description: 'Water Treatment Plant',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'WWTP',
        description: 'Wastewater Treatment Plant',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: 'Effluent',
        description: 'Industrial effluent treatment system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        name: 'Monitoring Point',
        description: 'Water quality monitoring point',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        name: 'Other',
        description: 'Other system type',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"SystemTypes"', 'id'),
        COALESCE((SELECT MAX(id) FROM "SystemTypes"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SystemTypes', null, {});
  }
};
