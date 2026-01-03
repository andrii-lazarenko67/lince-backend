'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GeneratedReports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      templateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ReportTemplates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      systemIds: {
        type: Sequelize.JSON,
        allowNull: true
      },
      period: {
        type: Sequelize.JSON,
        allowNull: true
      },
      filters: {
        type: Sequelize.JSON,
        allowNull: true
      },
      config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      pdfUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      publicId: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      generatedAt: {
        allowNull: false,
        type: Sequelize.DATE
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

    await queryInterface.addIndex('GeneratedReports', ['userId']);
    await queryInterface.addIndex('GeneratedReports', ['clientId']);
    await queryInterface.addIndex('GeneratedReports', ['templateId']);
    await queryInterface.addIndex('GeneratedReports', ['userId', 'clientId', 'generatedAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GeneratedReports');
  }
};
