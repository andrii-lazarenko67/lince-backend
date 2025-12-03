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
    parameterId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unitId: {
      type: DataTypes.INTEGER,
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
    }
  }, {
    tableName: 'MonitoringPoints',
    timestamps: true
  });

  MonitoringPoint.associate = function(models) {
    MonitoringPoint.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    MonitoringPoint.hasMany(models.DailyLogEntry, { foreignKey: 'monitoringPointId', as: 'entries' });
    MonitoringPoint.belongsTo(models.Parameter, { foreignKey: 'parameterId', as: 'parameterObj' });
    MonitoringPoint.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unitObj' });
  };

  return MonitoringPoint;
};
