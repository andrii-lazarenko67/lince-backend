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
      { name: 'Sem unidade', abbreviation: '', category: 'dimensionless', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Concentration units
      { name: 'Miligramas por litro', abbreviation: 'mg/L', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Partes por milhão', abbreviation: 'ppm', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Miligramas por litro CaCO3', abbreviation: 'mg/L CaCO3', category: 'concentration', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Temperature units
      { name: 'Graus Celsius', abbreviation: '°C', category: 'temperature', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Graus Fahrenheit', abbreviation: '°F', category: 'temperature', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Turbidity units
      { name: 'Unidade Nefelométrica de Turbidez', abbreviation: 'NTU', category: 'turbidity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Conductivity units
      { name: 'Microsiemens por centímetro', abbreviation: 'µS/cm', category: 'conductivity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Millisiemens por centímetro', abbreviation: 'mS/cm', category: 'conductivity', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Color units
      { name: 'Unidades Hazen', abbreviation: 'uH', category: 'color', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Volume units
      { name: 'Mililitros por litro', abbreviation: 'mL/L', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Flow rate units
      { name: 'Metros cúbicos por hora', abbreviation: 'm³/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Litros por hora', abbreviation: 'L/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros por hora', abbreviation: 'ml/h', category: 'flow_rate', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Dosage units (for product dosage)
      { name: 'Litros por dia', abbreviation: 'L/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros por dia', abbreviation: 'ml/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Quilogramas por dia', abbreviation: 'kg/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gramas por dia', abbreviation: 'g/day', category: 'dosage', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() }
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
