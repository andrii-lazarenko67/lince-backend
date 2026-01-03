'use strict';

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
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
    isServiceProvider: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'Organizations',
    timestamps: true
  });

  Organization.associate = function(models) {
    Organization.hasMany(models.User, { foreignKey: 'organizationId', as: 'users' });
    Organization.hasMany(models.Client, { foreignKey: 'organizationId', as: 'clients' });
  };

  return Organization;
};
