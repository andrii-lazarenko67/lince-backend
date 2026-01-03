'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserClients', {
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
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      accessLevel: {
        type: Sequelize.ENUM('view', 'edit', 'admin'),
        allowNull: false,
        defaultValue: 'view'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Unique constraint to prevent duplicate user-client entries
    await queryInterface.addIndex('UserClients', ['userId', 'clientId'], {
      unique: true,
      name: 'user_clients_unique'
    });

    await queryInterface.addIndex('UserClients', ['userId']);
    await queryInterface.addIndex('UserClients', ['clientId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserClients');
  }
};
