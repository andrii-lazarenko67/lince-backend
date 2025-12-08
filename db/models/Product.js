'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    minStockAlert: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'Products',
    timestamps: true
  });

  Product.associate = function(models) {
    Product.hasMany(models.ProductUsage, { foreignKey: 'productId', as: 'usages' });
  };

  return Product;
};
