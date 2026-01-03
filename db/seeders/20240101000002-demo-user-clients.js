'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('UserClients', [
      // Carlos Silva (manager, owner) has admin access to all service provider clients
      { id: 1, userId: 1, clientId: 1, accessLevel: 'admin', createdAt: new Date() },
      { id: 2, userId: 1, clientId: 2, accessLevel: 'admin', createdAt: new Date() },
      { id: 3, userId: 1, clientId: 3, accessLevel: 'admin', createdAt: new Date() },

      // Ana Santos (manager) has edit access to all service provider clients
      { id: 4, userId: 2, clientId: 1, accessLevel: 'edit', createdAt: new Date() },
      { id: 5, userId: 2, clientId: 2, accessLevel: 'edit', createdAt: new Date() },
      { id: 6, userId: 2, clientId: 3, accessLevel: 'edit', createdAt: new Date() },

      // Pedro Oliveira (technician) assigned to Hotel Praia Azul
      { id: 7, userId: 3, clientId: 1, accessLevel: 'edit', createdAt: new Date() },

      // Maria Costa (technician) assigned to Condomínio Solar das Palmeiras
      { id: 8, userId: 4, clientId: 2, accessLevel: 'edit', createdAt: new Date() },

      // João Ferreira (technician) assigned to Indústria Metalúrgica Norte
      { id: 9, userId: 5, clientId: 3, accessLevel: 'edit', createdAt: new Date() },

      // Ricardo Pereira (end customer) has admin access to his own company
      { id: 10, userId: 6, clientId: 4, accessLevel: 'admin', createdAt: new Date() }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"UserClients"', 'id'),
        COALESCE((SELECT MAX(id) FROM "UserClients"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserClients', null, {});
  }
};
