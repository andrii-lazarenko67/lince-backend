'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Clients', 'cancelAtPeriodEnd', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('Clients', 'trialReminderSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Clients', 'cancelAtPeriodEnd');
    await queryInterface.removeColumn('Clients', 'trialReminderSentAt');
  }
};
