'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obter o primeiro usuário (admin/gerente) para definir como criador
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" ORDER BY id ASC LIMIT 1;`
    );

    if (users.length === 0) {
      throw new Error('Nenhum usuário encontrado. Execute os seeders de usuários primeiro.');
    }

    const creatorId = users[0].id;

    await queryInterface.bulkInsert('Units', [
      // pH (sem unidade)
      { name: 'Sem unidade', abbreviation: '', category: 'adimensional', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de concentração
      { name: 'Miligramas por litro', abbreviation: 'mg/L', category: 'concentracao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Partes por milhão', abbreviation: 'ppm', category: 'concentracao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Miligramas por litro CaCO3', abbreviation: 'mg/L CaCO3', category: 'concentracao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de temperatura
      { name: 'Graus Celsius', abbreviation: '°C', category: 'temperatura', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Graus Fahrenheit', abbreviation: '°F', category: 'temperatura', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de turbidez
      { name: 'Unidade Nefelométrica de Turbidez', abbreviation: 'NTU', category: 'turbidez', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de condutividade
      { name: 'Microsiemens por centímetro', abbreviation: 'µS/cm', category: 'condutividade', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Millisiemens por centímetro', abbreviation: 'mS/cm', category: 'condutividade', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de cor
      { name: 'Unidades Hazen', abbreviation: 'uH', category: 'cor', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de volume
      { name: 'Litros', abbreviation: 'L', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros', abbreviation: 'mL', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros por litro', abbreviation: 'mL/L', category: 'volume', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de massa
      { name: 'Quilogramas', abbreviation: 'kg', category: 'massa', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gramas', abbreviation: 'g', category: 'massa', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de vazão
      { name: 'Metros cúbicos por hora', abbreviation: 'm³/h', category: 'vazao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Litros por hora', abbreviation: 'L/h', category: 'vazao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros por hora', abbreviation: 'mL/h', category: 'vazao', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },

      // Unidades de dosagem (para dosagem de produtos)
      { name: 'Litros por dia', abbreviation: 'L/dia', category: 'dosagem', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mililitros por dia', abbreviation: 'mL/dia', category: 'dosagem', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Quilogramas por dia', abbreviation: 'kg/dia', category: 'dosagem', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gramas por dia', abbreviation: 'g/dia', category: 'dosagem', createdBy: creatorId, isSystemDefault: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Redefinir sequência para sincronizar com dados inseridos (específico para PostgreSQL)
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
