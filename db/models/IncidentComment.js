'use strict';

module.exports = (sequelize, DataTypes) => {
  const IncidentComment = sequelize.define('IncidentComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    incidentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'IncidentComments',
    timestamps: true
  });

  IncidentComment.associate = function(models) {
    IncidentComment.belongsTo(models.Incident, { foreignKey: 'incidentId', as: 'incident' });
    IncidentComment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return IncidentComment;
};
