'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Clients', [
      {
        id: 1,
        ownerId: 1,
        name: 'Hotel Praia Azul',
        address: 'Av. Beira Mar, 1500 - Fortaleza, CE',
        contact: 'Roberto Mendes',
        phone: '+55 85 99999-1001',
        email: 'roberto@hotelpraia.com.br',
        logo: null,
        brandColor: '#1976d2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        ownerId: 1,
        name: 'Condomínio Solar das Palmeiras',
        address: 'Rua das Acácias, 200 - São Paulo, SP',
        contact: 'Fernanda Lima',
        phone: '+55 11 99999-2002',
        email: 'sindico@solarpalmeiras.com.br',
        logo: null,
        brandColor: '#2e7d32',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        ownerId: 1,
        name: 'Indústria Metalúrgica Norte',
        address: 'Rod. BR-101, Km 45 - Recife, PE',
        contact: 'Marcos Almeida',
        phone: '+55 81 99999-3003',
        email: 'marcos@metalnorte.ind.br',
        logo: null,
        brandColor: '#f57c00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        ownerId: 6,
        name: 'Empresa Cliente Final',
        address: 'Rua Principal, 100 - Rio de Janeiro, RJ',
        contact: 'Ricardo Pereira',
        phone: '+55 21 99999-0006',
        email: 'ricardo@clientefinal.com.br',
        logo: null,
        brandColor: '#9c27b0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Clients"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Clients"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Clients', null, {});
  }
};
