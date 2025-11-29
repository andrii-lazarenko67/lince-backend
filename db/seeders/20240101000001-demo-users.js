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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
