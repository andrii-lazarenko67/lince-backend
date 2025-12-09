'use strict';

module.exports = (sequelize, DataTypes) => {
  const Incident = sequelize.define('Incident', {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Incidents',
    timestamps: true
  });

  Incident.associate = function(models) {
    Incident.belongsTo(models.User, { foreignKey: 'userId', as: 'reporter' });
    Incident.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignee' });
    Incident.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    Incident.belongsTo(models.System, { foreignKey: 'stageId', as: 'stage' });
    Incident.hasMany(models.IncidentPhoto, { foreignKey: 'incidentId', as: 'photos' });
    Incident.hasMany(models.IncidentComment, { foreignKey: 'incidentId', as: 'comments' });
  };

  return Incident;
};
