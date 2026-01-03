'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Clients', [
      {
        id: 1,
        ownerId: 1,
        name: 'Blue Beach Resort',
        address: '1500 Ocean Drive - Miami, FL',
        contact: 'Robert Miller',
        phone: '+1 305-555-1001',
        email: 'robert@bluebeachresort.com',
        logo: null,
        brandColor: '#1976d2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        ownerId: 1,
        name: 'Palm Gardens Condominiums',
        address: '200 Palm Avenue - Los Angeles, CA',
        contact: 'Jennifer White',
        phone: '+1 213-555-2002',
        email: 'manager@palmgardens.com',
        logo: null,
        brandColor: '#2e7d32',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        ownerId: 1,
        name: 'Northern Steel Industries',
        address: '45 Industrial Parkway - Chicago, IL',
        contact: 'Mark Anderson',
        phone: '+1 312-555-3003',
        email: 'mark@northernsteel.com',
        logo: null,
        brandColor: '#f57c00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        ownerId: 6,
        name: 'End Customer Company',
        address: '100 Main Street - New York, NY',
        contact: 'Richard Parker',
        phone: '+1 555-000-0006',
        email: 'richard@endcustomer.com',
        logo: null,
        brandColor: '#9c27b0',
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
