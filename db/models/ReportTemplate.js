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
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('service_provider', 'end_customer', 'both'),
      allowNull: false,
      defaultValue: 'both'
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false
      // Config structure based on CLIENT_REQUIREMENTS_FINAL.md:
      // {
      //   blocks: [
      //     { type: 'identification', enabled: true, order: 1 },
      //     { type: 'scope', enabled: true, order: 2 },
      //     { type: 'systems', enabled: true, order: 3, includePhotos: true },
      //     { type: 'analyses', enabled: true, order: 4, includeCharts: true, highlightAlerts: true },
      //     { type: 'inspections', enabled: true, order: 5, includePhotos: true },
      //     { type: 'occurrences', enabled: true, order: 6, includeTimeline: true },
      //     { type: 'conclusion', enabled: true, order: 7 },
      //     { type: 'signature', enabled: true, order: 8 },
      //     { type: 'attachments', enabled: false, order: 9 }
      //   ],
      //   branding: {
      //     showLogo: true,
      //     logoPosition: 'left',
      //     primaryColor: '#1976d2',
      //     showHeader: true,
      //     headerText: 'Technical Report',
      //     showFooter: true,
      //     footerText: 'Page {page} of {pages}'
      //   }
      // }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isGlobal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    systemTypeIds: {
      type: DataTypes.JSON,
      allowNull: true
      // Array of system type IDs that this template is designed for
      // If null or empty, template is shown for all clients
      // Example: [1, 2, 3] means template is for system types 1, 2, and 3
    }
  }, {
    tableName: 'ReportTemplates',
    timestamps: true
  });

  ReportTemplate.associate = function(models) {
    ReportTemplate.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    ReportTemplate.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    ReportTemplate.hasMany(models.GeneratedReport, { foreignKey: 'templateId', as: 'generatedReports' });
  };

  return ReportTemplate;
};
