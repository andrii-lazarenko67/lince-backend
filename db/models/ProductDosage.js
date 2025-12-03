'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductDosage = sequelize.define('ProductDosage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unitId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dosageMode: {
      type: DataTypes.ENUM('manual', 'automatic'),
      allowNull: false,
      defaultValue: 'manual'
    },
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ProductDosages',
    timestamps: true
  });

  ProductDosage.associate = function(models) {
    ProductDosage.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    ProductDosage.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    ProductDosage.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    ProductDosage.belongsTo(models.User, { foreignKey: 'recordedBy', as: 'recorder' });
  };

  return ProductDosage;
};
