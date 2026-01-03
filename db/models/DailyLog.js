'use strict';

module.exports = (sequelize, DataTypes) => {
  const DailyLog = sequelize.define('DailyLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    recordType: {
      type: DataTypes.ENUM('field', 'laboratory'),
      allowNull: false,
      defaultValue: 'field'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    period: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    timeMode: {
      type: DataTypes.ENUM('auto', 'manual'),
      allowNull: true,
      defaultValue: 'manual'
    },
    laboratory: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    collectionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    collectionTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    collectionTimeMode: {
      type: DataTypes.ENUM('auto', 'manual'),
      allowNull: true,
      defaultValue: 'manual'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'DailyLogs',
    timestamps: true
  });

  DailyLog.associate = function(models) {
    DailyLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    DailyLog.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    DailyLog.belongsTo(models.System, { foreignKey: 'stageId', as: 'stage' });
    DailyLog.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    DailyLog.hasMany(models.DailyLogEntry, { foreignKey: 'dailyLogId', as: 'entries' });
  };

  return DailyLog;
};
