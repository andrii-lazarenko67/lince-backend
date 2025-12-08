'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add recordType field (field | laboratory)
    await queryInterface.addColumn('DailyLogs', 'recordType', {
      type: Sequelize.ENUM('field', 'laboratory'),
      allowNull: false,
      defaultValue: 'field'
    });

    // Add stageId field (optional - can be null for system-level records)
    await queryInterface.addColumn('DailyLogs', 'stageId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Systems',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add period field (replacing shift concept)
    await queryInterface.addColumn('DailyLogs', 'period', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Add time field (optional)
    await queryInterface.addColumn('DailyLogs', 'time', {
      type: Sequelize.TIME,
      allowNull: true
    });

    // Add timeMode field (auto | manual)
    await queryInterface.addColumn('DailyLogs', 'timeMode', {
      type: Sequelize.ENUM('auto', 'manual'),
      allowNull: true,
      defaultValue: 'manual'
    });

    // Add laboratory field (for laboratory records)
    await queryInterface.addColumn('DailyLogs', 'laboratory', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    // Add collectionDate field (for laboratory records - may differ from record date)
    await queryInterface.addColumn('DailyLogs', 'collectionDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    // Add collectionTime field (for laboratory records)
    await queryInterface.addColumn('DailyLogs', 'collectionTime', {
      type: Sequelize.TIME,
      allowNull: true
    });

    // Add collectionTimeMode field
    await queryInterface.addColumn('DailyLogs', 'collectionTimeMode', {
      type: Sequelize.ENUM('auto', 'manual'),
      allowNull: true,
      defaultValue: 'manual'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('DailyLogs', 'recordType');
    await queryInterface.removeColumn('DailyLogs', 'stageId');
    await queryInterface.removeColumn('DailyLogs', 'period');
    await queryInterface.removeColumn('DailyLogs', 'time');
    await queryInterface.removeColumn('DailyLogs', 'timeMode');
    await queryInterface.removeColumn('DailyLogs', 'laboratory');
    await queryInterface.removeColumn('DailyLogs', 'collectionDate');
    await queryInterface.removeColumn('DailyLogs', 'collectionTime');
    await queryInterface.removeColumn('DailyLogs', 'collectionTimeMode');

    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DailyLogs_recordType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DailyLogs_timeMode";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DailyLogs_collectionTimeMode";');
  }
};
