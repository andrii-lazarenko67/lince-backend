'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductUsage = sequelize.define('ProductUsage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'ProductUsages',
    timestamps: true
  });

  ProductUsage.associate = function(models) {
    ProductUsage.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    ProductUsage.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    ProductUsage.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
  };

  return ProductUsage;
};
