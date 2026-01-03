'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Products" WHERE "isActive" = true ORDER BY id;`
    );

    // Get systems (parent systems only for main usage)
    const [systems] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id;`
    );

    // Get a user for the usage records
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" LIMIT 1;`
    );

    if (products.length === 0 || systems.length === 0 || users.length === 0) {
      console.log('No products, systems, or users found. Skipping ProductUsages seeder.');
      return;
    }

    const userId = users[0].id;

    // Create lookup maps
    const productMap = {};
    products.forEach(p => { productMap[p.name] = p.id; });

    const systemMap = {};
    systems.forEach(s => { systemMap[s.name] = s.id; });

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Define product-system relationships based on typical water treatment usage
    const usageData = [
      // Piscina Principal - Hotel Sunset
      { product: 'Hipoclorito de Sódio 12%', system: 'Piscina Principal - Hotel Sunset', quantity: 50, date: oneMonthAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'Piscina Principal - Hotel Sunset', quantity: 45, date: twoWeeksAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'Piscina Principal - Hotel Sunset', quantity: 55, date: oneWeekAgo },
      { product: 'Ácido Clorídrico 33%', system: 'Piscina Principal - Hotel Sunset', quantity: 20, date: oneMonthAgo },
      { product: 'Ácido Clorídrico 33%', system: 'Piscina Principal - Hotel Sunset', quantity: 15, date: oneWeekAgo },
      { product: 'Barrilha Leve (Carbonato de Sódio)', system: 'Piscina Principal - Hotel Sunset', quantity: 10, date: twoWeeksAgo },
      { product: 'Algicida Quaternário', system: 'Piscina Principal - Hotel Sunset', quantity: 5, date: oneMonthAgo },
      { product: 'Clarificante Líquido', system: 'Piscina Principal - Hotel Sunset', quantity: 3, date: twoWeeksAgo },
      { product: 'Estabilizador de Cloro (Ácido Cianúrico)', system: 'Piscina Principal - Hotel Sunset', quantity: 2, date: oneMonthAgo },

      // Piscina Infantil - Hotel Sunset
      { product: 'Hipoclorito de Sódio 12%', system: 'Piscina Infantil - Hotel Sunset', quantity: 15, date: oneMonthAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'Piscina Infantil - Hotel Sunset', quantity: 12, date: oneWeekAgo },
      { product: 'Ácido Clorídrico 33%', system: 'Piscina Infantil - Hotel Sunset', quantity: 5, date: twoWeeksAgo },
      { product: 'Algicida Quaternário', system: 'Piscina Infantil - Hotel Sunset', quantity: 2, date: oneMonthAgo },

      // Torre de Resfriamento - Unidade 1
      { product: 'Dióxido de Cloro', system: 'Torre de Resfriamento - Unidade 1', quantity: 10, date: oneMonthAgo },
      { product: 'Dióxido de Cloro', system: 'Torre de Resfriamento - Unidade 1', quantity: 8, date: oneWeekAgo },
      { product: 'Ácido Sulfúrico 98%', system: 'Torre de Resfriamento - Unidade 1', quantity: 15, date: twoWeeksAgo },
      { product: 'Bactericida Industrial THPS', system: 'Torre de Resfriamento - Unidade 1', quantity: 10, date: oneMonthAgo },
      { product: 'Bactericida Industrial THPS', system: 'Torre de Resfriamento - Unidade 1', quantity: 8, date: oneWeekAgo },
      { product: 'Inibidor de Corrosão', system: 'Torre de Resfriamento - Unidade 1', quantity: 20, date: oneMonthAgo },
      { product: 'Inibidor de Incrustação', system: 'Torre de Resfriamento - Unidade 1', quantity: 15, date: twoWeeksAgo },
      { product: 'Dispersante Polimérico', system: 'Torre de Resfriamento - Unidade 1', quantity: 10, date: oneWeekAgo },
      { product: 'Anti-espumante', system: 'Torre de Resfriamento - Unidade 1', quantity: 5, date: oneMonthAgo },

      // Torre de Resfriamento - Unidade 2
      { product: 'Dióxido de Cloro', system: 'Torre de Resfriamento - Unidade 2', quantity: 8, date: twoWeeksAgo },
      { product: 'Bactericida Industrial THPS', system: 'Torre de Resfriamento - Unidade 2', quantity: 6, date: oneWeekAgo },
      { product: 'Inibidor de Corrosão', system: 'Torre de Resfriamento - Unidade 2', quantity: 15, date: oneMonthAgo },
      { product: 'Inibidor de Incrustação', system: 'Torre de Resfriamento - Unidade 2', quantity: 10, date: twoWeeksAgo },

      // Caldeira a Vapor - Principal
      { product: 'Ácido Sulfúrico 98%', system: 'Caldeira a Vapor - Principal', quantity: 20, date: oneMonthAgo },
      { product: 'Soda Cáustica (Hidróxido de Sódio)', system: 'Caldeira a Vapor - Principal', quantity: 25, date: twoWeeksAgo },
      { product: 'Soda Cáustica (Hidróxido de Sódio)', system: 'Caldeira a Vapor - Principal', quantity: 20, date: oneWeekAgo },
      { product: 'Sequestrante de Oxigênio', system: 'Caldeira a Vapor - Principal', quantity: 15, date: oneMonthAgo },
      { product: 'Sequestrante de Oxigênio', system: 'Caldeira a Vapor - Principal', quantity: 12, date: oneWeekAgo },
      { product: 'Alcalinizante para Caldeira', system: 'Caldeira a Vapor - Principal', quantity: 20, date: twoWeeksAgo },
      { product: 'Inibidor de Incrustação', system: 'Caldeira a Vapor - Principal', quantity: 18, date: oneMonthAgo },

      // ETA - Estação de Tratamento
      { product: 'Sulfato de Alumínio', system: 'ETA - Estação de Tratamento', quantity: 100, date: oneMonthAgo },
      { product: 'Sulfato de Alumínio', system: 'ETA - Estação de Tratamento', quantity: 80, date: twoWeeksAgo },
      { product: 'PAC (Policloreto de Alumínio)', system: 'ETA - Estação de Tratamento', quantity: 60, date: oneWeekAgo },
      { product: 'Polímero Aniônico', system: 'ETA - Estação de Tratamento', quantity: 10, date: oneMonthAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'ETA - Estação de Tratamento', quantity: 80, date: twoWeeksAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'ETA - Estação de Tratamento', quantity: 70, date: oneWeekAgo },
      { product: 'Barrilha Leve (Carbonato de Sódio)', system: 'ETA - Estação de Tratamento', quantity: 50, date: oneMonthAgo },
      { product: 'Carvão Ativado Granulado', system: 'ETA - Estação de Tratamento', quantity: 40, date: oneMonthAgo },

      // ETE - Tratamento de Efluentes
      { product: 'Polímero Catiônico', system: 'ETE - Tratamento de Efluentes', quantity: 15, date: oneMonthAgo },
      { product: 'Polímero Catiônico', system: 'ETE - Tratamento de Efluentes', quantity: 10, date: oneWeekAgo },
      { product: 'Polímero Aniônico', system: 'ETE - Tratamento de Efluentes', quantity: 8, date: twoWeeksAgo },
      { product: 'Soda Cáustica (Hidróxido de Sódio)', system: 'ETE - Tratamento de Efluentes', quantity: 30, date: oneMonthAgo },
      { product: 'Ácido Clorídrico 33%', system: 'ETE - Tratamento de Efluentes', quantity: 25, date: twoWeeksAgo },
      { product: 'Hipoclorito de Sódio 12%', system: 'ETE - Tratamento de Efluentes', quantity: 40, date: oneWeekAgo },
      { product: 'Anti-espumante', system: 'ETE - Tratamento de Efluentes', quantity: 8, date: oneMonthAgo },
      { product: 'Declorante (Tiossulfato de Sódio)', system: 'ETE - Tratamento de Efluentes', quantity: 5, date: twoWeeksAgo },

      // Sistema de Efluentes - Linha 1
      { product: 'Ácido Clorídrico 33%', system: 'Sistema de Efluentes - Linha 1', quantity: 15, date: oneMonthAgo },
      { product: 'Soda Cáustica (Hidróxido de Sódio)', system: 'Sistema de Efluentes - Linha 1', quantity: 20, date: twoWeeksAgo },
      { product: 'PAC (Policloreto de Alumínio)', system: 'Sistema de Efluentes - Linha 1', quantity: 25, date: oneWeekAgo },
      { product: 'Polímero Aniônico', system: 'Sistema de Efluentes - Linha 1', quantity: 5, date: oneMonthAgo }
    ];

    // Build insert data, filtering out any products or systems that don't exist
    const insertData = [];
    for (const usage of usageData) {
      const productId = productMap[usage.product];
      const systemId = systemMap[usage.system];

      if (productId && systemId) {
        insertData.push({
          productId,
          systemId,
          userId,
          type: 'out',
          quantity: usage.quantity,
          notes: `Uso registrado em ${usage.system}`,
          date: usage.date,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (insertData.length > 0) {
      await queryInterface.bulkInsert('ProductUsages', insertData, {});

      // Reset sequence
      await queryInterface.sequelize.query(`
        SELECT setval(
          pg_get_serial_sequence('"ProductUsages"', 'id'),
          COALESCE((SELECT MAX(id) FROM "ProductUsages"), 0),
          true
        );
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductUsages', null, {});
  }
};
