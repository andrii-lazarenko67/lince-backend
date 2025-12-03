'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DailyLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      systemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Systems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      notes: {
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

    await queryInterface.addIndex('DailyLogs', ['userId', 'systemId', 'date'], {
      unique: true,
      name: 'daily_logs_user_system_date_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DailyLogs');
  }
};
