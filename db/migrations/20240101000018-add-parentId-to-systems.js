'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Systems', 'parentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Systems',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for better query performance
    await queryInterface.addIndex('Systems', ['parentId'], {
      name: 'systems_parent_id_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Systems', 'systems_parent_id_index');
    await queryInterface.removeColumn('Systems', 'parentId');
  }
};
