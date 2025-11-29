'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MonitoringPoints', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      systemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Systems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      parameter: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      minValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      maxValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      alertEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MonitoringPoints');
  }
};
