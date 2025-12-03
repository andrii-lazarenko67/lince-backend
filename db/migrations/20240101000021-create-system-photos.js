'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SystemPhotos', {
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
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploadedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add indexes for faster queries
    await queryInterface.addIndex('SystemPhotos', ['systemId']);
    await queryInterface.addIndex('SystemPhotos', ['uploadedBy']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SystemPhotos');
  }
};
