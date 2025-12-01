'use strict';

module.exports = (sequelize, DataTypes) => {
  const NotificationRecipient = sequelize.define('NotificationRecipient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'NotificationRecipients',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['notificationId', 'userId']
      }
    ]
  });

  NotificationRecipient.associate = function(models) {
    NotificationRecipient.belongsTo(models.Notification, { foreignKey: 'notificationId', as: 'notification' });
    NotificationRecipient.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return NotificationRecipient;
};
