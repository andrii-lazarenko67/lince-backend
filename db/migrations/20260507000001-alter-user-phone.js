'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true,
      unique: false
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  }
};
