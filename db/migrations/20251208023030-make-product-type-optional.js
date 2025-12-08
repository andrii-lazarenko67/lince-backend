'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Products', 'type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Products', 'type', {
      type: Sequelize.STRING(50),
      allowNull: false
    });
  }
};
