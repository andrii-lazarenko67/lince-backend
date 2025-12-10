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
      { name: 'pH', description: 'Water pH measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Chlorine', description: 'Free residual chlorine measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Temperature', description: 'Temperature measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Turbidity', description: 'Water turbidity measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Alkalinity', description: 'Total alkalinity measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Conductivity', description: 'Electrical conductivity measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hardness', description: 'Total hardness measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Silica', description: 'Silica measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'DO', description: 'Dissolved oxygen', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Iron', description: 'Total iron measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Color', description: 'Apparent color measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'BOD', description: 'Biochemical Oxygen Demand', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'COD', description: 'Chemical Oxygen Demand', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'SS', description: 'Settleable Solids', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Flow Rate', description: 'Flow rate measurement', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cycles', description: 'Concentration cycles', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Parameters', null, {});
  }
};
