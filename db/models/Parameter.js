'use strict';

module.exports = (sequelize, DataTypes) => {
  const Parameter = sequelize.define('Parameter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'Parameters',
    timestamps: true
  });

  Parameter.associate = function(models) {
    Parameter.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Parameter.hasMany(models.MonitoringPoint, { foreignKey: 'parameterId', as: 'monitoringPoints' });
  };

  return Parameter;
};
