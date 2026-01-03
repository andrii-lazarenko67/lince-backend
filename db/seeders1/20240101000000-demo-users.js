'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        name: 'Charles Smith',
        email: 'manager@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+1 555-000-0001',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Anna Johnson',
        email: 'anna.johnson@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+1 555-000-0002',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Peter Williams',
        email: 'technician@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0003',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'Mary Brown',
        email: 'mary.brown@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0004',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'John Davis',
        email: 'john.davis@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0005',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: 'Richard Parker',
        email: 'customer@endcustomer.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+1 555-000-0006',
        isServiceProvider: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Users"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Users"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
