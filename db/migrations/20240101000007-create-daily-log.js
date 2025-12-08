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
      recordType: {
        type: Sequelize.ENUM('field', 'laboratory'),
        allowNull: false,
        defaultValue: 'field'
      },
      stageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Systems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      period: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      timeMode: {
        type: Sequelize.ENUM('auto', 'manual'),
        allowNull: true,
        defaultValue: 'manual'
      },
      laboratory: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      collectionDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      collectionTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      collectionTimeMode: {
        type: Sequelize.ENUM('auto', 'manual'),
        allowNull: true,
        defaultValue: 'manual'
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
