'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IoTReadings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'IoTDevices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      systemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Systems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      monitoringPointId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'MonitoringPoints', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      value: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false
      },
      isOutOfRange: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      recordedAt: {
        type: Sequelize.DATE,
        allowNull: false
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

    await queryInterface.addIndex('IoTReadings', ['deviceId', 'recordedAt']);
    await queryInterface.addIndex('IoTReadings', ['clientId', 'systemId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('IoTReadings');
  }
};
