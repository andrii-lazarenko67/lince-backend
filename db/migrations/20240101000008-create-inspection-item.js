'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InspectionItems', {
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
      checklistItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ChecklistItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM('pass', 'fail', 'na'),
        allowNull: false
      },
      comment: {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InspectionItems');
  }
};
