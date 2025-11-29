'use strict';

module.exports = (sequelize, DataTypes) => {
  const System = sequelize.define('System', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'Systems',
    timestamps: true
  });

  System.associate = function(models) {
    System.hasMany(models.MonitoringPoint, { foreignKey: 'systemId', as: 'monitoringPoints' });
    System.hasMany(models.ChecklistItem, { foreignKey: 'systemId', as: 'checklistItems' });
    System.hasMany(models.DailyLog, { foreignKey: 'systemId', as: 'dailyLogs' });
    System.hasMany(models.Inspection, { foreignKey: 'systemId', as: 'inspections' });
    System.hasMany(models.Incident, { foreignKey: 'systemId', as: 'incidents' });
    System.hasMany(models.Document, { foreignKey: 'systemId', as: 'documents' });
    System.hasMany(models.ProductUsage, { foreignKey: 'systemId', as: 'productUsages' });
  };

  return System;
};
