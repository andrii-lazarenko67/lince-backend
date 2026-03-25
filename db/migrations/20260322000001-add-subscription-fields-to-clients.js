'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Clients', 'plan', {
      type: Sequelize.ENUM('starter', 'pro', 'enterprise', 'none'),
      defaultValue: 'none',
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'subscriptionStatus', {
      type: Sequelize.ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired', 'none'),
      defaultValue: 'none',
      allowNull: false
    });

    await queryInterface.addColumn('Clients', 'stripeCustomerId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Clients', 'stripeSubscriptionId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Clients', 'trialEndsAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Clients', 'currentPeriodEnd', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Clients', 'plan');
    await queryInterface.removeColumn('Clients', 'subscriptionStatus');
    await queryInterface.removeColumn('Clients', 'stripeCustomerId');
    await queryInterface.removeColumn('Clients', 'stripeSubscriptionId');
    await queryInterface.removeColumn('Clients', 'trialEndsAt');
    await queryInterface.removeColumn('Clients', 'currentPeriodEnd');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Clients_plan";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Clients_subscriptionStatus";');
  }
};
