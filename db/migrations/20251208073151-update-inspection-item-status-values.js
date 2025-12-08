'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 1: Convert status column to VARCHAR temporarily
    await queryInterface.sequelize.query('ALTER TABLE "InspectionItems" ALTER COLUMN status TYPE VARCHAR(10);');

    // Step 2: Update existing data to new values
    // pass -> C (Conforme)
    // fail -> NC (No Conforme)
    // na -> NA (No Aplica)
    await queryInterface.sequelize.query(`
      UPDATE "InspectionItems"
      SET status = CASE
        WHEN status = 'pass' THEN 'C'
        WHEN status = 'fail' THEN 'NC'
        WHEN status = 'na' THEN 'NA'
        ELSE status
      END
    `);

    // Step 3: Drop the old enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_InspectionItems_status";');

    // Step 4: Create new enum with new values
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_InspectionItems_status" AS ENUM ('C', 'NC', 'NA', 'NV');
    `);

    // Step 5: Alter column to use new enum
    await queryInterface.sequelize.query(`
      ALTER TABLE "InspectionItems"
      ALTER COLUMN status TYPE "enum_InspectionItems_status"
      USING status::"enum_InspectionItems_status";
    `);

    // Step 6: Set NOT NULL constraint
    await queryInterface.sequelize.query('ALTER TABLE "InspectionItems" ALTER COLUMN status SET NOT NULL;');
  },

  async down (queryInterface, Sequelize) {
    // Reverse the migration
    await queryInterface.sequelize.query(`
      UPDATE "InspectionItems"
      SET status = CASE
        WHEN status = 'C' THEN 'pass'
        WHEN status = 'NC' THEN 'fail'
        WHEN status = 'NA' THEN 'na'
        WHEN status = 'NV' THEN 'na'
        ELSE status
      END
    `);

    await queryInterface.sequelize.query('ALTER TABLE "InspectionItems" ALTER COLUMN status TYPE VARCHAR(10);');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_InspectionItems_status";');

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_InspectionItems_status" AS ENUM ('pass', 'fail', 'na');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "InspectionItems"
      ALTER COLUMN status TYPE "enum_InspectionItems_status"
      USING status::"enum_InspectionItems_status";
    `);
  }
};
