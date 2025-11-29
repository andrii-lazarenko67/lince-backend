'use strict';

module.exports = (sequelize, DataTypes) => {
  const DailyLogEntry = sequelize.define('DailyLogEntry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dailyLogId: {
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
      defaultValue: false
    }
  }, {
    tableName: 'DailyLogEntries',
    timestamps: true
  });

  DailyLogEntry.associate = function(models) {
    DailyLogEntry.belongsTo(models.DailyLog, { foreignKey: 'dailyLogId', as: 'dailyLog' });
    DailyLogEntry.belongsTo(models.MonitoringPoint, { foreignKey: 'monitoringPointId', as: 'monitoringPoint' });
  };

  return DailyLogEntry;
};
