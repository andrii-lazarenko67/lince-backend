'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserClient = sequelize.define('UserClient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accessLevel: {
      type: DataTypes.ENUM('view', 'edit', 'admin'),
      allowNull: false,
      defaultValue: 'view'
    }
  }, {
    tableName: 'UserClients',
    timestamps: true,
    updatedAt: false
  });

  UserClient.associate = function(models) {
    UserClient.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    UserClient.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return UserClient;
};
