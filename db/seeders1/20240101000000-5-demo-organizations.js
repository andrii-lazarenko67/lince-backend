'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Organizations', [
      {
        id: 1,
        name: 'AquaTech Water Services',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Organizations"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Organizations"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Organizations', null, {});
  }
};
