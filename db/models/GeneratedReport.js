'use strict';

module.exports = (sequelize, DataTypes) => {
  const GeneratedReport = sequelize.define('GeneratedReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    systemIds: {
      type: DataTypes.JSON,
      allowNull: true
    },
    period: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { includeAlerts: true, includePhotos: true, includeCharts: true }
    },
    config: {
      type: DataTypes.JSON,
      allowNull: true
      // Snapshot of template config at generation time
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    publicId: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'GeneratedReports',
    timestamps: true
  });

  GeneratedReport.associate = function(models) {
    GeneratedReport.belongsTo(models.ReportTemplate, { foreignKey: 'templateId', as: 'template' });
    GeneratedReport.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    GeneratedReport.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return GeneratedReport;
};
