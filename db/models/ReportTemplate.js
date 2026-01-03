'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReportTemplate = sequelize.define('ReportTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      // Config structure:
      // {
      //   modules: [
      //     { id: 'systems', enabled: true, order: 1, settings: {} },
      //     { id: 'dailyLogs', enabled: true, order: 2, settings: { showChart: true } },
      //     { id: 'inspections', enabled: true, order: 3, settings: {} },
      //     { id: 'incidents', enabled: false, order: 4, settings: {} },
      //     { id: 'products', enabled: true, order: 5, settings: {} }
      //   ],
      //   settings: { showSummary: true, showCharts: true }
      // }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'ReportTemplates',
    timestamps: true
  });

  ReportTemplate.associate = function(models) {
    ReportTemplate.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ReportTemplate;
};
