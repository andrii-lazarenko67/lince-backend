'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Notifications table (shared notification content)
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('alert', 'incident', 'inspection', 'stock', 'system'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      referenceType: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      referenceId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      }
    });

    await queryInterface.addIndex('Notifications', ['clientId']);

    // Create NotificationRecipients table (tracks read status per user)
    await queryInterface.createTable('NotificationRecipients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      notificationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Notifications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint to prevent duplicate recipient entries
    await queryInterface.addIndex('NotificationRecipients', ['notificationId', 'userId'], {
      unique: true,
      name: 'notification_recipient_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NotificationRecipients');
    await queryInterface.dropTable('Notifications');
  }
};
