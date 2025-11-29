'use strict';

module.exports = (sequelize, DataTypes) => {
  const Inspection = sequelize.define('Inspection', {
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
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'approved'),
      defaultValue: 'pending'
    },
    conclusion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    managerNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Inspections',
    timestamps: true
  });

  Inspection.associate = function(models) {
    Inspection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Inspection.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    Inspection.hasMany(models.InspectionItem, { foreignKey: 'inspectionId', as: 'items' });
    Inspection.hasMany(models.InspectionPhoto, { foreignKey: 'inspectionId', as: 'photos' });
  };

  return Inspection;
};
