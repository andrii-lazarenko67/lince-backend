'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change the status enum from 'approved' to 'viewed'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Inspections_status" RENAME VALUE 'approved' TO 'viewed';
    `);

    // Add viewedBy column
    await queryInterface.addColumn('Inspections', 'viewedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add viewedAt column
    await queryInterface.addColumn('Inspections', 'viewedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove viewedAt column
    await queryInterface.removeColumn('Inspections', 'viewedAt');

    // Remove viewedBy column
    await queryInterface.removeColumn('Inspections', 'viewedBy');

    // Revert enum value from 'viewed' back to 'approved'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Inspections_status" RENAME VALUE 'viewed' TO 'approved';
    `);
  }
};
