'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DailyLogEntries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dailyLogId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'DailyLogs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      monitoringPointId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MonitoringPoints',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      value: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false
      },
      isOutOfRange: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('DailyLogEntries');
  }
};
