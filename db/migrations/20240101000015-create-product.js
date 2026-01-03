'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      typeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ProductTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      supplier: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      currentStock: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      minStockAlert: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recommendedDosage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('Products', ['clientId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};
