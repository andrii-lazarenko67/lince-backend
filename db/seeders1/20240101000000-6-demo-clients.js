'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Clients', [
      {
        id: 1,
        organizationId: 1,
        name: 'Blue Beach Resort',
        address: '1500 Ocean Drive - Miami, FL',
        contact: 'Robert Miller',
        phone: '+1 305-555-1001',
        email: 'robert@bluebeachresort.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        organizationId: 1,
        name: 'Palm Gardens Condominiums',
        address: '200 Palm Avenue - Los Angeles, CA',
        contact: 'Jennifer White',
        phone: '+1 213-555-2002',
        email: 'manager@palmgardens.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        organizationId: 1,
        name: 'Northern Steel Industries',
        address: '45 Industrial Parkway - Chicago, IL',
        contact: 'Mark Anderson',
        phone: '+1 312-555-3003',
        email: 'mark@northernsteel.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Clients"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Clients"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Clients', null, {});
  }
};
