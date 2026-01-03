'use strict';

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    organizationId: {
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'Clients',
    timestamps: true
  });

  Client.associate = function(models) {
    Client.belongsTo(models.Organization, { foreignKey: 'organizationId', as: 'organization' });
    Client.hasMany(models.System, { foreignKey: 'clientId', as: 'systems' });
    Client.hasMany(models.DailyLog, { foreignKey: 'clientId', as: 'dailyLogs' });
    Client.hasMany(models.Inspection, { foreignKey: 'clientId', as: 'inspections' });
    Client.hasMany(models.Incident, { foreignKey: 'clientId', as: 'incidents' });
    Client.hasMany(models.Product, { foreignKey: 'clientId', as: 'products' });
    Client.hasMany(models.Document, { foreignKey: 'clientId', as: 'documents' });
  };

  return Client;
};
