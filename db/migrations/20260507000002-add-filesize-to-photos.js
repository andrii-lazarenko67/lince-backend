'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('IncidentPhotos', 'fileSize', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0
    });
    await queryInterface.addColumn('InspectionPhotos', 'fileSize', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('IncidentPhotos', 'fileSize');
    await queryInterface.removeColumn('InspectionPhotos', 'fileSize');
  }
};
