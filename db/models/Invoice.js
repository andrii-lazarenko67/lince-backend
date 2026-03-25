'use strict';

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stripeInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount in cents (e.g. 14900 = R$149.00)'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'brl'
    },
    status: {
      type: DataTypes.ENUM('paid', 'open', 'void', 'uncollectible'),
      allowNull: false,
      defaultValue: 'open'
    },
    plan: {
      type: DataTypes.ENUM('starter', 'pro', 'enterprise', 'none'),
      allowNull: false,
      defaultValue: 'none'
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'Invoices',
    timestamps: true
  });

  Invoice.associate = function(models) {
    Invoice.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return Invoice;
};
