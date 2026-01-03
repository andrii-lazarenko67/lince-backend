'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch ProductTypes to get their IDs
    const productTypes = await queryInterface.sequelize.query(
      'SELECT id, name FROM "ProductTypes"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Fetch Units to get their IDs
    const units = await queryInterface.sequelize.query(
      'SELECT id, abbreviation FROM "Units"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create a lookup map for type names to IDs
    const typeMap = {};
    productTypes.forEach(pt => {
      typeMap[pt.name] = pt.id;
    });

    // Create a lookup map for unit abbreviations to IDs
    const unitMap = {};
    units.forEach(u => {
      unitMap[u.abbreviation] = u.id;
    });

    await queryInterface.bulkInsert('Products', [
      // Desinfetantes e Oxidantes
      {
        name: 'Hipoclorito de Sódio 12%',
        typeId: typeMap['Desinfetante'],
        unitId: unitMap['L'],
        supplier: 'Química Brasil Ltda',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Cloro líquido para desinfecção de água, concentração 12%. Usado em piscinas e sistemas de água potável.',
        recommendedDosage: 'Piscinas: 50-100 ml/m³ para manutenção diária. Tratamento de choque: 200-300 ml/m³. Água potável: conforme análise de cloro residual (manter 0,5-2,0 ppm).',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cloro Granulado 65%',
        typeId: typeMap['Desinfetante'],
        unitId: unitMap['kg'],
        supplier: 'Pool Tech Brasil',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Hipoclorito de cálcio granulado, alta concentração. Ideal para tratamento de choque em piscinas.',
        recommendedDosage: 'Tratamento de choque: 10-15 g/m³. Manutenção: 3-5 g/m³ diariamente. Dissolver previamente em balde antes de aplicar.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dióxido de Cloro',
        typeId: typeMap['Desinfetante'],
        unitId: unitMap['L'],
        supplier: 'BioQuímica Industrial',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Desinfetante oxidante para sistemas de água potável e torres de resfriamento. Alta eficiência contra biofilme.',
        recommendedDosage: 'Água potável: 0,1-0,5 ppm. Torres de resfriamento: 0,5-2,0 ppm. Aplicar continuamente ou por batelada conforme necessidade.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Reguladores de pH
      {
        name: 'Ácido Clorídrico 33%',
        typeId: typeMap['Redutor de pH'],
        unitId: unitMap['L'],
        supplier: 'Química Brasil Ltda',
        currentStock: 200.00,
        minStockAlert: 50.00,
        description: 'Ácido muriático para redução de pH e alcalinidade. Manuseio requer EPI adequado.',
        recommendedDosage: 'Piscinas: 100-200 ml/10m³ para reduzir 0,2 unidades de pH. Adicionar lentamente ao redor da piscina com bomba ligada. Aguardar 4 horas antes de usar.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ácido Sulfúrico 98%',
        typeId: typeMap['Redutor de pH'],
        unitId: unitMap['L'],
        supplier: 'IndQuímica S.A.',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Ácido concentrado para sistemas industriais. Usado em caldeiras e torres de resfriamento.',
        recommendedDosage: 'Torres de resfriamento: Diluir a 10% antes de aplicar. Dosagem: 50-100 ml de solução diluída/m³ para ajustar pH. Caldeiras: conforme análise de pH (manter 10,5-11,5). Aplicar por bomba dosadora.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Barrilha Leve (Carbonato de Sódio)',
        typeId: typeMap['Elevador de pH'],
        unitId: unitMap['kg'],
        supplier: 'Mineração Alcalis',
        currentStock: 300.00,
        minStockAlert: 50.00,
        description: 'Aumenta pH e alcalinidade da água. Produto em pó, fácil dissolução.',
        recommendedDosage: 'Piscinas: 100-150 g/10m³ para elevar 0,2 unidades de pH. Dissolver em balde antes de aplicar. Para alcalinidade: 150-200 g/10m³ eleva 10 ppm. Aplicar com bomba ligada.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Soda Cáustica (Hidróxido de Sódio)',
        typeId: typeMap['Elevador de pH'],
        unitId: unitMap['kg'],
        supplier: 'Química Brasil Ltda',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Produto alcalino forte para correção de pH em sistemas industriais.',
        recommendedDosage: 'Torres de resfriamento: Solução a 10%, dosar 20-50 ml/m³ para elevar pH. Tratamento de efluentes: conforme análise. CUIDADO: Produto corrosivo, usar EPI completo. Adicionar sempre a água, nunca o contrário.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Algicidas e Bactericidas
      {
        name: 'Algicida Quaternário',
        typeId: typeMap['Algicida'],
        unitId: unitMap['L'],
        supplier: 'Pool Tech Brasil',
        currentStock: 75.00,
        minStockAlert: 15.00,
        description: 'Controle preventivo de algas em piscinas. Não espumante, compatível com cloro.',
        recommendedDosage: 'Manutenção preventiva: 50-100 ml/10m³ semanalmente. Tratamento de choque (água verde): 200-300 ml/10m³. Aplicar ao entardecer com bomba ligada. Aguardar 24h para banho.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Algicida Cobre',
        typeId: typeMap['Algicida'],
        unitId: unitMap['L'],
        supplier: 'AquaTrat Produtos',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Sulfato de cobre quelatizado para tratamento de algas resistentes. Ação prolongada.',
        recommendedDosage: 'Tratamento de algas persistentes: 100-150 ml/10m³. Manutenção: 30-50 ml/10m³ quinzenalmente. Não usar em piscinas com revestimento metálico. Manter pH entre 7,2-7,6. Aguardar 48h para banho.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bactericida Industrial THPS',
        typeId: typeMap['Bactericida'],
        unitId: unitMap['L'],
        supplier: 'BioQuímica Industrial',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Biocida biodegradável para torres de resfriamento. Eficaz contra Legionella.',
        recommendedDosage: 'Torres de resfriamento: Dosagem inicial: 50-100 ppm (50-100 ml/m³). Manutenção: 10-20 ppm (10-20 ml/m³) semanalmente. Para controle de Legionella: 100-200 ppm por 24h, depois manter 20-30 ppm.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Inibidores e Dispersantes
      {
        name: 'Inibidor de Corrosão',
        typeId: typeMap['Inibidor'],
        unitId: unitMap['L'],
        supplier: 'IndQuímica S.A.',
        currentStock: 120.00,
        minStockAlert: 25.00,
        description: 'Protege superfícies metálicas em sistemas de água. Base fosfato/molibdato.',
        recommendedDosage: 'Torres de resfriamento: 30-50 ppm (30-50 ml/m³) na partida inicial. Manutenção: 10-20 ppm (10-20 ml/m³) conforme purga. Sistemas fechados: 200-500 ppm. Aplicar por bomba dosadora contínua.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Inibidor de Incrustação',
        typeId: typeMap['Anti-incrustante'],
        unitId: unitMap['L'],
        supplier: 'AquaTrat Produtos',
        currentStock: 90.00,
        minStockAlert: 20.00,
        description: 'Previne formação de carbonato e sulfato de cálcio. Para caldeiras e torres.',
        recommendedDosage: 'Torres de resfriamento: 20-40 ppm (20-40 ml/m³) conforme dureza da água. Caldeiras: 50-100 ppm na água de alimentação. Ajustar conforme análise de incrustação. Dosagem contínua por bomba.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dispersante Polimérico',
        typeId: typeMap['Dispersante'],
        unitId: unitMap['L'],
        supplier: 'BioQuímica Industrial',
        currentStock: 55.00,
        minStockAlert: 10.00,
        description: 'Mantém sólidos em suspensão, evita depósitos. Para sistemas de resfriamento.',
        recommendedDosage: 'Torres de resfriamento: 10-30 ppm (10-30 ml/m³) conforme turbidez da água. Adicionar continuamente junto com biocida. Ajustar dosagem conforme análise de sólidos suspensos.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Coagulantes e Floculantes
      {
        name: 'Sulfato de Alumínio',
        typeId: typeMap['Coagulante'],
        unitId: unitMap['kg'],
        supplier: 'Mineração Alcalis',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Coagulante primário para tratamento de água. Remove turbidez e cor.',
        recommendedDosage: 'Tratamento de água: 10-50 mg/L (10-50 g/m³) conforme turbidez. Preparar solução a 10% e dosar no canal de mistura rápida. Ajustar pH para 6,5-7,5. Realizar jar test para dosagem ótima.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PAC (Policloreto de Alumínio)',
        typeId: typeMap['Coagulante'],
        unitId: unitMap['L'],
        supplier: 'IndQuímica S.A.',
        currentStock: 300.00,
        minStockAlert: 60.00,
        description: 'Coagulante líquido de alta eficiência. Menor geração de lodo que sulfato.',
        recommendedDosage: 'Tratamento de água: 5-30 mg/L (5-30 ml/m³) conforme turbidez. Usar puro ou diluído a 10%. Dosar na entrada do decantador. pH ótimo: 6,0-8,0. Realizar jar test. Reduz 30% do lodo vs sulfato.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Polímero Aniônico',
        typeId: typeMap['Floculante'],
        unitId: unitMap['kg'],
        supplier: 'AquaTrat Produtos',
        currentStock: 50.00,
        minStockAlert: 10.00,
        description: 'Auxiliar de floculação em pó. Acelera sedimentação de partículas.',
        recommendedDosage: 'Preparar solução a 0,1-0,5% com agitação lenta. Dosar 0,1-1,0 mg/L (0,1-1,0 g/m³) após coagulante. Adicionar em tanque de floculação com agitação suave. Tempo maturação: 30min.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Polímero Catiônico',
        typeId: typeMap['Floculante'],
        unitId: unitMap['kg'],
        supplier: 'AquaTrat Produtos',
        currentStock: 45.00,
        minStockAlert: 10.00,
        description: 'Para desidratação de lodo e tratamento de efluentes.',
        recommendedDosage: 'Desidratação de lodo: Preparar solução a 0,5%. Dosar 2-10 kg/ton de lodo seco. Centrifugação: 3-6 kg/ton. Filtro prensa: 5-10 kg/ton. Ajustar por teste de bancada.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Produtos para Caldeira
      {
        name: 'Sequestrante de Oxigênio',
        typeId: typeMap['Tratamento Caldeira'],
        unitId: unitMap['L'],
        supplier: 'IndQuímica S.A.',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Remove oxigênio dissolvido da água de caldeira. Previne corrosão por pitting.',
        recommendedDosage: 'Água de alimentação de caldeira: 10-20 ppm (10-20 ml/m³) para cada 1 ppm de O₂. Dosar continuamente no tanque de alimentação. Verificar O₂ residual < 0,02 ppm. Base sulfito de sódio.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Alcalinizante para Caldeira',
        typeId: typeMap['Tratamento Caldeira'],
        unitId: unitMap['kg'],
        supplier: 'BioQuímica Industrial',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Mantém alcalinidade adequada na água de caldeira. Protege contra corrosão ácida.',
        recommendedDosage: 'Água de caldeira: Manter alcalinidade 200-400 ppm (baixa pressão) ou 400-700 ppm (alta pressão). Dosar conforme purga. Controlar pH 10,5-11,5. Usar fosfato trissódico ou soda cáustica.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Produtos Auxiliares
      {
        name: 'Clarificante Líquido',
        typeId: typeMap['Clarificante'],
        unitId: unitMap['L'],
        supplier: 'Pool Tech Brasil',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Melhora transparência da água de piscinas. Aglomera partículas finas.',
        recommendedDosage: 'Piscinas: 50-100 ml/10m³ quando água estiver turva. Aplicar diretamente na piscina com bomba ligada. Manter filtração por 24h. Fazer retrolavagem após. Não usar com floculante granulado.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Estabilizador de Cloro (Ácido Cianúrico)',
        typeId: typeMap['Estabilizante'],
        unitId: unitMap['kg'],
        supplier: 'Pool Tech Brasil',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Protege cloro da degradação UV. Para piscinas externas.',
        recommendedDosage: 'Piscinas externas: Manter nível 30-50 ppm. Dosagem inicial: 40-60 g/10m³. Dissolver em balde e adicionar no skimmer com bomba ligada. Aplicar 1 vez/mês. Não usar em piscinas cobertas.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Declorante (Tiossulfato de Sódio)',
        typeId: typeMap['Neutralizante'],
        unitId: unitMap['kg'],
        supplier: 'Química Brasil Ltda',
        currentStock: 30.00,
        minStockAlert: 5.00,
        description: 'Remove cloro residual da água. Usado antes do descarte ou análises.',
        recommendedDosage: 'Neutralização de cloro: 7 g para cada 1 ppm de cloro em 1m³. Dissolver em água e adicionar ao sistema. Aguardar 15 min e testar cloro residual (deve estar < 0,1 ppm). Para análises laboratoriais.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Anti-espumante',
        typeId: typeMap['Auxiliar'],
        unitId: unitMap['L'],
        supplier: 'AquaTrat Produtos',
        currentStock: 25.00,
        minStockAlert: 5.00,
        description: 'Elimina espuma em torres de resfriamento e estações de tratamento.',
        recommendedDosage: 'Torres de resfriamento: 10-50 ppm (10-50 ml/m³) conforme severidade da espuma. ETE: 5-20 ppm. Adicionar direto no ponto de espuma. Base silicone ou poliéter. Reaplicar conforme necessário.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Carvão Ativado Granulado',
        typeId: typeMap['Adsorvente'],
        unitId: unitMap['kg'],
        supplier: 'Mineração Alcalis',
        currentStock: 200.00,
        minStockAlert: 40.00,
        description: 'Remove cloro, odores e compostos orgânicos. Para filtros de carvão.',
        recommendedDosage: 'Filtros de água: Altura do leito 0,8-1,2 m. Taxa de filtração 10-20 m³/m²/h. Trocar quando cloro residual > 0,5 ppm na saída. Retrolavagem semanal. Vida útil: 12-24 meses conforme uso.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Products"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Products"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
