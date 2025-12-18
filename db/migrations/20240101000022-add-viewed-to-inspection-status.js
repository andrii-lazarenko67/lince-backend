'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'viewed' to the enum_Inspections_status enum type if it doesn't exist
    // PostgreSQL specific command to add a value to an existing enum
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'viewed'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Inspections_status')
        ) THEN
          ALTER TYPE "enum_Inspections_status" ADD VALUE 'viewed';
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For safety, we leave this as a no-op
  }
};
