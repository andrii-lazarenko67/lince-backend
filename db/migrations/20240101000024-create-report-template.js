'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReportTemplates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL of the template logo stored in Cloudinary'
      },
      type: {
        type: Sequelize.ENUM('service_provider', 'end_customer', 'both'),
        allowNull: false,
        defaultValue: 'both'
      },
      config: {
        type: Sequelize.JSON,
        allowNull: false
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isGlobal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('ReportTemplates', ['userId']);
    await queryInterface.addIndex('ReportTemplates', ['clientId']);
    await queryInterface.addIndex('ReportTemplates', ['userId', 'clientId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReportTemplates');
  }
};
