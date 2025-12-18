'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Charles Smith',
        email: 'manager@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+1 555-000-0001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Anna Johnson',
        email: 'anna.johnson@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+1 555-000-0002',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Peter Williams',
        email: 'technician@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0003',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mary Brown',
        email: 'mary.brown@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0004',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'John Davis',
        email: 'john.davis@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+1 555-000-0005',
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
