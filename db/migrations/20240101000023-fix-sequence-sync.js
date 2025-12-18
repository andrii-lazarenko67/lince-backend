'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix PostgreSQL sequences that may be out of sync after seeding data with explicit IDs
    // This ensures auto-increment works correctly for all tables

    const tables = [
      'SystemTypes',
      'Systems',
      'Users',
      'Parameters',
      'Units',
      'MonitoringPoints',
      'ChecklistItems',
      'DailyLogs',
      'DailyLogEntries',
      'Inspections',
      'InspectionItems',
      'InspectionPhotos',
      'Incidents',
      'IncidentPhotos',
      'IncidentComments',
      'Products',
      'ProductUsages',
      'Documents',
      'Notifications',
      'ProductDosages',
      'SystemPhotos'
    ];

    for (const table of tables) {
      try {
        // Check if the table exists and has an id column with a sequence
        await queryInterface.sequelize.query(`
          DO $$
          DECLARE
            max_id INTEGER;
            seq_name TEXT;
          BEGIN
            -- Get the sequence name for this table's id column
            SELECT pg_get_serial_sequence('"${table}"', 'id') INTO seq_name;

            -- Only proceed if a sequence exists for this table
            IF seq_name IS NOT NULL THEN
              -- Get the max id from the table
              EXECUTE 'SELECT COALESCE(MAX(id), 0) FROM "${table}"' INTO max_id;

              -- Reset the sequence to max_id (next value will be max_id + 1)
              EXECUTE 'SELECT setval(''' || seq_name || ''', ' || max_id || ', true)';

              RAISE NOTICE 'Reset sequence for ${table} to %', max_id;
            END IF;
          EXCEPTION
            WHEN undefined_table THEN
              -- Table doesn't exist, skip it
              RAISE NOTICE 'Table ${table} does not exist, skipping';
            WHEN others THEN
              -- Other error, log and continue
              RAISE NOTICE 'Error resetting sequence for ${table}: %', SQLERRM;
          END
          $$;
        `);
      } catch (error) {
        console.log(`Note: Could not reset sequence for ${table}:`, error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is idempotent and doesn't need to be reversed
    // The sequences will be correct regardless of whether this runs
  }
};
