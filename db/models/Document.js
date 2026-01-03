'use strict';

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    publicId: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Documents',
    timestamps: true
  });

  Document.associate = function(models) {
    Document.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    Document.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
    Document.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return Document;
};
