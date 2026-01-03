'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('alert', 'incident', 'inspection', 'stock', 'system'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Notifications',
    timestamps: true,
    updatedAt: false
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
    Notification.hasMany(models.NotificationRecipient, { foreignKey: 'notificationId', as: 'recipients' });
    Notification.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return Notification;
};
