'use strict';

module.exports = (sequelize, DataTypes) => {
  const InspectionItem = sequelize.define('InspectionItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    inspectionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    checklistItemId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pass', 'fail', 'na'),
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'InspectionItems',
    timestamps: true
  });

  InspectionItem.associate = function(models) {
    InspectionItem.belongsTo(models.Inspection, { foreignKey: 'inspectionId', as: 'inspection' });
    InspectionItem.belongsTo(models.ChecklistItem, { foreignKey: 'checklistItemId', as: 'checklistItem' });
  };

  return InspectionItem;
};
