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
    systemTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SystemTypes',
        key: 'id'
      }
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
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Systems',
        key: 'id'
      }
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Systems',
    timestamps: true
  });

  System.associate = function(models) {
    // System Type association
    System.belongsTo(models.SystemType, {
      foreignKey: 'systemTypeId',
      as: 'systemType'
    });

    // Client association
    System.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });

    // Regular associations
    System.hasMany(models.MonitoringPoint, { foreignKey: 'systemId', as: 'monitoringPoints' });
    System.hasMany(models.ChecklistItem, { foreignKey: 'systemId', as: 'checklistItems' });
    System.hasMany(models.DailyLog, { foreignKey: 'systemId', as: 'dailyLogs' });
    System.hasMany(models.Inspection, { foreignKey: 'systemId', as: 'inspections' });
    System.hasMany(models.Incident, { foreignKey: 'systemId', as: 'incidents' });
    System.hasMany(models.Document, { foreignKey: 'systemId', as: 'documents' });
    System.hasMany(models.ProductUsage, { foreignKey: 'systemId', as: 'productUsages' });
    System.hasMany(models.SystemPhoto, { foreignKey: 'systemId', as: 'photos' });

    // Hierarchical associations (parent-child)
    System.belongsTo(models.System, { foreignKey: 'parentId', as: 'parent' });
    System.hasMany(models.System, { foreignKey: 'parentId', as: 'children' });
  };

  return System;
};
