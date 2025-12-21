'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductType = sequelize.define('ProductType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'ProductTypes',
    timestamps: true,
    updatedAt: false
  });

  ProductType.associate = function(models) {
    ProductType.hasMany(models.Product, { foreignKey: 'typeId', as: 'products' });
  };

  return ProductType;
};
