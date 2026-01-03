'use strict';

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    brandColor: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'Clients',
    timestamps: true
  });

  Client.associate = function(models) {
    Client.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    Client.belongsToMany(models.User, { through: models.UserClient, foreignKey: 'clientId', as: 'users' });
    Client.hasMany(models.UserClient, { foreignKey: 'clientId', as: 'userClients' });
    Client.hasMany(models.System, { foreignKey: 'clientId', as: 'systems' });
    Client.hasMany(models.DailyLog, { foreignKey: 'clientId', as: 'dailyLogs' });
    Client.hasMany(models.Inspection, { foreignKey: 'clientId', as: 'inspections' });
    Client.hasMany(models.Incident, { foreignKey: 'clientId', as: 'incidents' });
    Client.hasMany(models.Product, { foreignKey: 'clientId', as: 'products' });
    Client.hasMany(models.Document, { foreignKey: 'clientId', as: 'documents' });
    Client.hasMany(models.Notification, { foreignKey: 'clientId', as: 'notifications' });
    Client.hasMany(models.ReportTemplate, { foreignKey: 'clientId', as: 'reportTemplates' });
    Client.hasMany(models.GeneratedReport, { foreignKey: 'clientId', as: 'generatedReports' });
  };

  return Client;
};
