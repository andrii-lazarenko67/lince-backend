'use strict';

module.exports = (sequelize, DataTypes) => {
  const IncidentPhoto = sequelize.define('IncidentPhoto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    incidentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    publicId: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    caption: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'IncidentPhotos',
    timestamps: true
  });

  IncidentPhoto.associate = function(models) {
    IncidentPhoto.belongsTo(models.Incident, { foreignKey: 'incidentId', as: 'incident' });
  };

  return IncidentPhoto;
};
