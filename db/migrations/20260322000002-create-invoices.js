'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Invoices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stripeInvoiceId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      stripePaymentIntentId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Amount in cents (e.g. 14900 = R$149.00)'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'brl'
      },
      status: {
        type: Sequelize.ENUM('paid', 'open', 'void', 'uncollectible'),
        allowNull: false,
        defaultValue: 'open'
      },
      plan: {
        type: Sequelize.ENUM('starter', 'pro', 'enterprise', 'none'),
        allowNull: false,
        defaultValue: 'none'
      },
      pdfUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      periodStart: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      periodEnd: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('Invoices', ['clientId']);
    await queryInterface.addIndex('Invoices', ['stripeInvoiceId'], { unique: true, where: { stripeInvoiceId: { [Sequelize.Op?.ne ?? 'ne']: null } } });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Invoices');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Invoices_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Invoices_plan";');
  }
};
