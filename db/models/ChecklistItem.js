'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChecklistItem = sequelize.define('ChecklistItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'ChecklistItems',
    timestamps: true
  });

  ChecklistItem.associate = function(models) {
    ChecklistItem.belongsTo(models.System, { foreignKey: 'systemId', as: 'system' });
    ChecklistItem.hasMany(models.InspectionItem, { foreignKey: 'checklistItemId', as: 'inspectionItems' });
  };

  return ChecklistItem;
};
