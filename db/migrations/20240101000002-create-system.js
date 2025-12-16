'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Systems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Systems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      systemTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SystemTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
        defaultValue: 'active'
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

    // Add index for better query performance on hierarchical queries
    await queryInterface.addIndex('Systems', ['parentId'], {
      name: 'systems_parent_id_index'
    });

    // Add index for systemTypeId for better query performance
    await queryInterface.addIndex('Systems', ['systemTypeId'], {
      name: 'systems_system_type_id_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Systems');
  }
};
