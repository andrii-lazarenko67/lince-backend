'use strict';

module.exports = (sequelize, DataTypes) => {
  const MonitoringPoint = sequelize.define('MonitoringPoint', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    parameter: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    minValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    maxValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    alertEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'MonitoringPoints',
    timestamps: true
  });

  MonitoringPoint.associate = function(models) {
    MonitoringPoint.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    MonitoringPoint.hasMany(models.DailyLogEntry, { foreignKey: 'monitoringPointId', as: 'entries' });
  };

  return MonitoringPoint;
};
