'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Products', [
      // Desinfetantes e Oxidantes
      {
        name: 'Hipoclorito de Sódio 12%',
        type: 'Desinfetante',
        unit: 'L',
        supplier: 'Química Brasil Ltda',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Cloro líquido para desinfecção de água, concentração 12%. Usado em piscinas e sistemas de água potável.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cloro Granulado 65%',
        type: 'Desinfetante',
        unit: 'kg',
        supplier: 'Pool Tech Brasil',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Hipoclorito de cálcio granulado, alta concentração. Ideal para tratamento de choque em piscinas.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dióxido de Cloro',
        type: 'Desinfetante',
        unit: 'L',
        supplier: 'BioQuímica Industrial',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Desinfetante oxidante para sistemas de água potável e torres de resfriamento. Alta eficiência contra biofilme.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Reguladores de pH
      {
        name: 'Ácido Clorídrico 33%',
        type: 'Redutor de pH',
        unit: 'L',
        supplier: 'Química Brasil Ltda',
        currentStock: 200.00,
        minStockAlert: 50.00,
        description: 'Ácido muriático para redução de pH e alcalinidade. Manuseio requer EPI adequado.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ácido Sulfúrico 98%',
        type: 'Redutor de pH',
        unit: 'L',
        supplier: 'IndQuímica S.A.',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Ácido concentrado para sistemas industriais. Usado em caldeiras e torres de resfriamento.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Barrilha Leve (Carbonato de Sódio)',
        type: 'Elevador de pH',
        unit: 'kg',
        supplier: 'Mineração Alcalis',
        currentStock: 300.00,
        minStockAlert: 50.00,
        description: 'Aumenta pH e alcalinidade da água. Produto em pó, fácil dissolução.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Soda Cáustica (Hidróxido de Sódio)',
        type: 'Elevador de pH',
        unit: 'kg',
        supplier: 'Química Brasil Ltda',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Produto alcalino forte para correção de pH em sistemas industriais.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Algicidas e Bactericidas
      {
        name: 'Algicida Quaternário',
        type: 'Algicida',
        unit: 'L',
        supplier: 'Pool Tech Brasil',
        currentStock: 75.00,
        minStockAlert: 15.00,
        description: 'Controle preventivo de algas em piscinas. Não espumante, compatível com cloro.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Algicida Cobre',
        type: 'Algicida',
        unit: 'L',
        supplier: 'AquaTrat Produtos',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Sulfato de cobre quelatizado para tratamento de algas resistentes. Ação prolongada.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bactericida Industrial THPS',
        type: 'Bactericida',
        unit: 'L',
        supplier: 'BioQuímica Industrial',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Biocida biodegradável para torres de resfriamento. Eficaz contra Legionella.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Inibidores e Dispersantes
      {
        name: 'Inibidor de Corrosão',
        type: 'Inibidor',
        unit: 'L',
        supplier: 'IndQuímica S.A.',
        currentStock: 120.00,
        minStockAlert: 25.00,
        description: 'Protege superfícies metálicas em sistemas de água. Base fosfato/molibdato.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Inibidor de Incrustação',
        type: 'Anti-incrustante',
        unit: 'L',
        supplier: 'AquaTrat Produtos',
        currentStock: 90.00,
        minStockAlert: 20.00,
        description: 'Previne formação de carbonato e sulfato de cálcio. Para caldeiras e torres.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dispersante Polimérico',
        type: 'Dispersante',
        unit: 'L',
        supplier: 'BioQuímica Industrial',
        currentStock: 55.00,
        minStockAlert: 10.00,
        description: 'Mantém sólidos em suspensão, evita depósitos. Para sistemas de resfriamento.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Coagulantes e Floculantes
      {
        name: 'Sulfato de Alumínio',
        type: 'Coagulante',
        unit: 'kg',
        supplier: 'Mineração Alcalis',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Coagulante primário para tratamento de água. Remove turbidez e cor.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PAC (Policloreto de Alumínio)',
        type: 'Coagulante',
        unit: 'L',
        supplier: 'IndQuímica S.A.',
        currentStock: 300.00,
        minStockAlert: 60.00,
        description: 'Coagulante líquido de alta eficiência. Menor geração de lodo que sulfato.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Polímero Aniônico',
        type: 'Floculante',
        unit: 'kg',
        supplier: 'AquaTrat Produtos',
        currentStock: 50.00,
        minStockAlert: 10.00,
        description: 'Auxiliar de floculação em pó. Acelera sedimentação de partículas.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Polímero Catiônico',
        type: 'Floculante',
        unit: 'kg',
        supplier: 'AquaTrat Produtos',
        currentStock: 45.00,
        minStockAlert: 10.00,
        description: 'Para desidratação de lodo e tratamento de efluentes.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Produtos para Caldeira
      {
        name: 'Sequestrante de Oxigênio',
        type: 'Tratamento Caldeira',
        unit: 'L',
        supplier: 'IndQuímica S.A.',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Remove oxigênio dissolvido da água de caldeira. Previne corrosão por pitting.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Alcalinizante para Caldeira',
        type: 'Tratamento Caldeira',
        unit: 'kg',
        supplier: 'BioQuímica Industrial',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Mantém alcalinidade adequada na água de caldeira. Protege contra corrosão ácida.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Produtos Auxiliares
      {
        name: 'Clarificante Líquido',
        type: 'Clarificante',
        unit: 'L',
        supplier: 'Pool Tech Brasil',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Melhora transparência da água de piscinas. Aglomera partículas finas.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Estabilizador de Cloro (Ácido Cianúrico)',
        type: 'Estabilizante',
        unit: 'kg',
        supplier: 'Pool Tech Brasil',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Protege cloro da degradação UV. Para piscinas externas.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Declorante (Tiossulfato de Sódio)',
        type: 'Neutralizante',
        unit: 'kg',
        supplier: 'Química Brasil Ltda',
        currentStock: 30.00,
        minStockAlert: 5.00,
        description: 'Remove cloro residual da água. Usado antes do descarte ou análises.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Anti-espumante',
        type: 'Auxiliar',
        unit: 'L',
        supplier: 'AquaTrat Produtos',
        currentStock: 25.00,
        minStockAlert: 5.00,
        description: 'Elimina espuma em torres de resfriamento e estações de tratamento.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Carvão Ativado Granulado',
        type: 'Adsorvente',
        unit: 'kg',
        supplier: 'Mineração Alcalis',
        currentStock: 200.00,
        minStockAlert: 40.00,
        description: 'Remove cloro, odores e compostos orgânicos. Para filtros de carvão.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
