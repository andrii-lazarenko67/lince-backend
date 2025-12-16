'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SystemTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index for better query performance
    await queryInterface.addIndex('SystemTypes', ['name'], {
      name: 'system_types_name_index',
      unique: true
    });

    // Reset the sequence to ensure it's in sync with existing data
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"SystemTypes"', 'id'),
        COALESCE((SELECT MAX(id) FROM "SystemTypes"), 0) + 1,
        false
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SystemTypes');
  }
};
