'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        name: 'Carlos Silva',
        email: 'manager@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+55 11 99999-0001',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Ana Santos',
        email: 'ana.santos@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+55 11 99999-0002',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Pedro Oliveira',
        email: 'technician@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0003',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'Maria Costa',
        email: 'maria.costa@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0004',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'João Ferreira',
        email: 'joao.ferreira@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0005',
        isServiceProvider: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: 'Ricardo Pereira',
        email: 'cliente@endcustomer.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+55 21 99999-0006',
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
