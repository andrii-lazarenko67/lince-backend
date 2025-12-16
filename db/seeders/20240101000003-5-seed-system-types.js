'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('SystemTypes', [
      {
        id: 1,
        name: 'Piscina',
        description: 'Sistema de piscina para uso recreativo ou terapêutico',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Torre de Resfriamento',
        description: 'Sistema de torre de resfriamento para ar condicionado central',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Caldeira',
        description: 'Sistema de caldeira para geração de vapor',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'ETA',
        description: 'Estação de Tratamento de Água',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'ETE',
        description: 'Estação de Tratamento de Esgoto',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: 'Efluente',
        description: 'Sistema de tratamento de efluentes industriais',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        name: 'Ponto de Monitoramento',
        description: 'Ponto de monitoramento de qualidade da água',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        name: 'Outro',
        description: 'Outro tipo de sistema',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SystemTypes', null, {});
  }
};
