'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InspectionPhotos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      inspectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Inspections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      publicId: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      caption: {
        type: Sequelize.STRING(255),
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InspectionPhotos');
  }
};
