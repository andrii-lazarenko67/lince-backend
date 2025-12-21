'use strict';

module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    abbreviation: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isSystemDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'Units',
    timestamps: true
  });

  Unit.associate = function(models) {
    Unit.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Unit.hasMany(models.MonitoringPoint, { foreignKey: 'unitId', as: 'monitoringPoints' });
    Unit.hasMany(models.Product, { foreignKey: 'unitId', as: 'products' });
  };

  return Unit;
};
