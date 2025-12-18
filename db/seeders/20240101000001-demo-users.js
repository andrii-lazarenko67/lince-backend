'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Carlos Silva',
        email: 'manager@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+55 11 99999-0001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ana Santos',
        email: 'ana.santos@lince.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+55 11 99999-0002',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pedro Oliveira',
        email: 'technician@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0003',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Maria Costa',
        email: 'maria.costa@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0004',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'João Ferreira',
        email: 'joao.ferreira@lince.com',
        password: hashedPassword,
        role: 'technician',
        phone: '+55 11 99999-0005',
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
