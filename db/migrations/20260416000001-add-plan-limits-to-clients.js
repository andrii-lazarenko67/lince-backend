'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Clients', 'systemsUsed', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'systemsLimit', {
      type: Sequelize.INTEGER,
      defaultValue: 3,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'usersUsed', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'usersLimit', {
      type: Sequelize.INTEGER,
      defaultValue: 5,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'aiInsightsUsed', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'aiInsightsLimit', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'storageUsed', {
      type: Sequelize.BIGINT,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'storageLimit', {
      type: Sequelize.BIGINT,
      defaultValue: 5368709120,
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'aiInsightsResetDate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Clients', 'systemsUsed');
    await queryInterface.removeColumn('Clients', 'systemsLimit');
    await queryInterface.removeColumn('Clients', 'usersUsed');
    await queryInterface.removeColumn('Clients', 'usersLimit');
    await queryInterface.removeColumn('Clients', 'aiInsightsUsed');
    await queryInterface.removeColumn('Clients', 'aiInsightsLimit');
    await queryInterface.removeColumn('Clients', 'storageUsed');
    await queryInterface.removeColumn('Clients', 'storageLimit');
    await queryInterface.removeColumn('Clients', 'aiInsightsResetDate');
  }
};
