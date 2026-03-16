'use strict';

module.exports = (sequelize, DataTypes) => {
  const IoTReading = sequelize.define('IoTReading', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monitoringPointId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false
    },
    isOutOfRange: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'IoTReadings',
    timestamps: true
  });

  IoTReading.associate = function(models) {
    IoTReading.belongsTo(models.IoTDevice, { foreignKey: 'deviceId', as: 'device' });
    IoTReading.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    IoTReading.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    IoTReading.belongsTo(models.MonitoringPoint, { foreignKey: 'monitoringPointId', as: 'monitoringPoint' });
  };

  return IoTReading;
};
