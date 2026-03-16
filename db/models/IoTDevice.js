'use strict';

module.exports = (sequelize, DataTypes) => {
  const IoTDevice = sequelize.define('IoTDevice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastValue: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    isOutOfRange: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    tableName: 'IoTDevices',
    timestamps: true
  });

  IoTDevice.associate = function(models) {
    IoTDevice.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    IoTDevice.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    IoTDevice.belongsTo(models.MonitoringPoint, { foreignKey: 'monitoringPointId', as: 'monitoringPoint' });
    IoTDevice.hasMany(models.IoTReading, { foreignKey: 'deviceId', as: 'readings' });
  };

  return IoTDevice;
};
