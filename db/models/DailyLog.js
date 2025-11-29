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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'DailyLogs',
    timestamps: true
  });

  DailyLog.associate = function(models) {
    DailyLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    DailyLog.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    DailyLog.hasMany(models.DailyLogEntry, { foreignKey: 'dailyLogId', as: 'entries' });
  };

  return DailyLog;
};
