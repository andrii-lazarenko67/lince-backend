'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first user (admin/manager) to set as creator
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" ORDER BY id ASC LIMIT 1;`
    );

    if (users.length === 0) {
      throw new Error('No users found. Please run user seeders first.');
    }

    const creatorId = users[0].id;

    await queryInterface.bulkInsert('Parameters', [
      // Water quality parameters
      { name: 'pH', description: 'Medição do pH da água', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cloro', description: 'Medição de cloro residual livre', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Temperatura', description: 'Medição de temperatura', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Turbidez', description: 'Medição de turbidez da água', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Alcalinidade', description: 'Medição de alcalinidade total', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Condutividade', description: 'Medição de condutividade elétrica', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Dureza', description: 'Medição de dureza total', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sílica', description: 'Medição de sílica', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'OD', description: 'Oxigênio dissolvido', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ferro', description: 'Medição de ferro total', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cor', description: 'Medição de cor aparente', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'DBO', description: 'Demanda Bioquímica de Oxigênio', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'DQO', description: 'Demanda Química de Oxigênio', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'SS', description: 'Sólidos Sedimentáveis', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Vazão', description: 'Medição de vazão', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ciclos', description: 'Ciclos de concentração', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Parameters"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Parameters"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Parameters', null, {});
  }
};
