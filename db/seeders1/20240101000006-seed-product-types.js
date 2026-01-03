'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ProductTypes', [
      {
        name: 'Disinfectant',
        description: 'Products for water disinfection and oxidation',
        createdAt: new Date()
      },
      {
        name: 'pH Reducer',
        description: 'Acidic products for water pH reduction',
        createdAt: new Date()
      },
      {
        name: 'pH Increaser',
        description: 'Alkaline products for water pH elevation',
        createdAt: new Date()
      },
      {
        name: 'Algaecide',
        description: 'Products for algae control and elimination',
        createdAt: new Date()
      },
      {
        name: 'Bactericide',
        description: 'Products for bacteria and microorganism control',
        createdAt: new Date()
      },
      {
        name: 'Inhibitor',
        description: 'Corrosion inhibitor products',
        createdAt: new Date()
      },
      {
        name: 'Anti-scalant',
        description: 'Products for scale prevention',
        createdAt: new Date()
      },
      {
        name: 'Dispersant',
        description: 'Dispersant products to keep solids in suspension',
        createdAt: new Date()
      },
      {
        name: 'Coagulant',
        description: 'Coagulant products for water treatment',
        createdAt: new Date()
      },
      {
        name: 'Flocculant',
        description: 'Flocculant products to aid sedimentation',
        createdAt: new Date()
      },
      {
        name: 'Boiler Treatment',
        description: 'Specific products for boiler water treatment',
        createdAt: new Date()
      },
      {
        name: 'Clarifier',
        description: 'Products for improving water clarity',
        createdAt: new Date()
      },
      {
        name: 'Stabilizer',
        description: 'Chlorine stabilizer products',
        createdAt: new Date()
      },
      {
        name: 'Neutralizer',
        description: 'Products for neutralizing chlorine and other chemicals',
        createdAt: new Date()
      },
      {
        name: 'Auxiliary',
        description: 'Various auxiliary products',
        createdAt: new Date()
      },
      {
        name: 'Adsorbent',
        description: 'Adsorbent products such as activated carbon',
        createdAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ProductTypes"', 'id'),
        COALESCE((SELECT MAX(id) FROM "ProductTypes"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductTypes', null, {});
  }
};
