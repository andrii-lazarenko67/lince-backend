'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('technician', 'manager', 'admin'),
      allowNull: false,
      defaultValue: 'technician'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  User.associate = function(models) {
    User.belongsTo(models.Organization, { foreignKey: 'organizationId', as: 'organization' });
    User.hasMany(models.DailyLog, { foreignKey: 'userId', as: 'dailyLogs' });
    User.hasMany(models.Inspection, { foreignKey: 'userId', as: 'inspections' });
    User.hasMany(models.Incident, { foreignKey: 'userId', as: 'incidents' });
    User.hasMany(models.Incident, { foreignKey: 'assignedTo', as: 'assignedIncidents' });
    User.hasMany(models.NotificationRecipient, { foreignKey: 'userId', as: 'notificationRecipients' });
    User.hasMany(models.Notification, { foreignKey: 'createdById', as: 'createdNotifications' });
    User.hasMany(models.Document, { foreignKey: 'uploadedBy', as: 'documents' });
    User.hasMany(models.ProductUsage, { foreignKey: 'userId', as: 'productUsages' });
    User.hasMany(models.IncidentComment, { foreignKey: 'userId', as: 'incidentComments' });
  };

  return User;
};
