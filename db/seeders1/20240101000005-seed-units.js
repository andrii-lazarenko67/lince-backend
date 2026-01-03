'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first user (admin/manager) to set as creator
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" ORDER BY id ASC LIMIT 1;`
    );

    if (users.length === 0) {
      throw new Error('No users found. Please run user seeders first.');
    }

    const creatorId = users[0].id;

    await queryInterface.bulkInsert('Units', [
      // pH (no unit)
      { name: 'No unit', abbreviation: '', category: 'dimensionless', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Concentration units
      { name: 'Milligrams per liter', abbreviation: 'mg/L', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Parts per million', abbreviation: 'ppm', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Milligrams per liter CaCO3', abbreviation: 'mg/L CaCO3', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Temperature units
      { name: 'Degrees Celsius', abbreviation: '°C', category: 'temperature', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Degrees Fahrenheit', abbreviation: '°F', category: 'temperature', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Turbidity units
      { name: 'Nephelometric Turbidity Unit', abbreviation: 'NTU', category: 'turbidity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Conductivity units
      { name: 'Microsiemens per centimeter', abbreviation: 'µS/cm', category: 'conductivity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Millisiemens per centimeter', abbreviation: 'mS/cm', category: 'conductivity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Color units
      { name: 'Hazen Units', abbreviation: 'uH', category: 'color', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Volume units
      { name: 'Liters', abbreviation: 'L', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Milliliters', abbreviation: 'mL', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Milliliters per liter', abbreviation: 'mL/L', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Mass units
      { name: 'Kilograms', abbreviation: 'kg', category: 'mass', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Grams', abbreviation: 'g', category: 'mass', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Flow rate units
      { name: 'Cubic meters per hour', abbreviation: 'm³/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Liters per hour', abbreviation: 'L/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Milliliters per hour', abbreviation: 'ml/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Dosage units (for product dosage)
      { name: 'Liters per day', abbreviation: 'L/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Milliliters per day', abbreviation: 'ml/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Kilograms per day', abbreviation: 'kg/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Grams per day', abbreviation: 'g/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Units"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Units"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Units', null, {});
  }
};
