'use strict';

module.exports = (sequelize, DataTypes) => {
  const InspectionPhoto = sequelize.define('InspectionPhoto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    inspectionId: {
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
    tableName: 'InspectionPhotos',
    timestamps: true
  });

  InspectionPhoto.associate = function(models) {
    InspectionPhoto.belongsTo(models.Inspection, { foreignKey: 'inspectionId', as: 'inspection' });
  };

  return InspectionPhoto;
};
