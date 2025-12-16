'use strict';

module.exports = (sequelize, DataTypes) => {
  const SystemType = sequelize.define('SystemType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'SystemTypes',
    timestamps: true
  });

  SystemType.associate = function(models) {
    // Association with System
    SystemType.hasMany(models.System, {
      foreignKey: 'systemTypeId',
      as: 'systems'
    });
  };

  return SystemType;
};
