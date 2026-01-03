'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ProductTypes', [
      {
        name: 'Desinfetante',
        description: 'Produtos para desinfecção e oxidação da água',
        createdAt: new Date()
      },
      {
        name: 'Redutor de pH',
        description: 'Produtos ácidos para redução do pH da água',
        createdAt: new Date()
      },
      {
        name: 'Elevador de pH',
        description: 'Produtos alcalinos para elevação do pH da água',
        createdAt: new Date()
      },
      {
        name: 'Algicida',
        description: 'Produtos para controle e eliminação de algas',
        createdAt: new Date()
      },
      {
        name: 'Bactericida',
        description: 'Produtos para controle de bactérias e micro-organismos',
        createdAt: new Date()
      },
      {
        name: 'Inibidor',
        description: 'Produtos inibidores de corrosão',
        createdAt: new Date()
      },
      {
        name: 'Anti-incrustante',
        description: 'Produtos para prevenção de incrustações',
        createdAt: new Date()
      },
      {
        name: 'Dispersante',
        description: 'Produtos dispersantes para manter sólidos em suspensão',
        createdAt: new Date()
      },
      {
        name: 'Coagulante',
        description: 'Produtos coagulantes para tratamento de água',
        createdAt: new Date()
      },
      {
        name: 'Floculante',
        description: 'Produtos floculantes para auxiliar na sedimentação',
        createdAt: new Date()
      },
      {
        name: 'Tratamento Caldeira',
        description: 'Produtos específicos para tratamento de água de caldeiras',
        createdAt: new Date()
      },
      {
        name: 'Clarificante',
        description: 'Produtos para melhoria da transparência da água',
        createdAt: new Date()
      },
      {
        name: 'Estabilizante',
        description: 'Produtos estabilizadores de cloro',
        createdAt: new Date()
      },
      {
        name: 'Neutralizante',
        description: 'Produtos para neutralização de cloro e outros químicos',
        createdAt: new Date()
      },
      {
        name: 'Auxiliar',
        description: 'Produtos auxiliares diversos',
        createdAt: new Date()
      },
      {
        name: 'Adsorvente',
        description: 'Produtos adsorventes como carvão ativado',
        createdAt: new Date()
      }
    ], {});

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ProductTypes"', 'id'),
        COALESCE((SELECT MAX(id) FROM "ProductTypes"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductTypes', null, {});
  }
};
