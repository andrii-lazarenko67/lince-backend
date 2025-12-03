'use strict';

module.exports = (sequelize, DataTypes) => {
  const SystemPhoto = sequelize.define('SystemPhoto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'SystemPhotos',
    timestamps: true
  });

  SystemPhoto.associate = function(models) {
    SystemPhoto.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    SystemPhoto.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
  };

  return SystemPhoto;
};
