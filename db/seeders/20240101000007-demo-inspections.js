'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date;
    };

    // Fetch actual inserted user and system IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const systems = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'technician@lince.com') userMap.pedro = user.id; // Pedro - userId 3
      else if (user.email === 'maria.costa@lince.com') userMap.maria = user.id; // Maria - userId 4
      else if (user.email === 'joao.ferreira@lince.com') userMap.joao = user.id; // João - userId 5
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Piscina Principal - Hotel Sunset') systemMap.piscina = system.id; // systemId 1
      else if (system.name === 'Torre de Resfriamento - Unidade 1') systemMap.torre = system.id; // systemId 3
      else if (system.name === 'Caldeira a Vapor - Principal') systemMap.caldeira = system.id; // systemId 5
      else if (system.name === 'ETA - Estação de Tratamento') systemMap.eta = system.id; // systemId 6
      else if (system.name === 'ETE - Tratamento de Efluentes') systemMap.ete = system.id; // systemId 7
    });

    // Create inspections
    const inspections = [
      // System 1: Piscina Principal - weekly inspections
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(56),
        status: 'completed',
        conclusion: 'Inspeção semanal realizada. Sistema em perfeitas condições. Filtros limpos.',
        managerNotes: 'Aprovado. Continuar monitoramento regular.',
        createdAt: getDate(56),
        updatedAt: getDate(56)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.maria,
        date: getDate(49),
        status: 'completed',
        conclusion: 'Verificados todos os equipamentos. Bomba dosadora de cloro necessita ajuste de calibração.',
        managerNotes: 'Solicitar manutenção preventiva.',
        createdAt: getDate(49),
        updatedAt: getDate(49)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.joao,
        date: getDate(42),
        status: 'completed',
        conclusion: 'Inspeção completa. Realizada limpeza preventiva dos pré-filtros.',
        managerNotes: null,
        createdAt: getDate(42),
        updatedAt: getDate(42)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(35),
        status: 'viewed',
        conclusion: 'Inspeção de segurança mensal. Todos os equipamentos de emergência verificados.',
        managerNotes: 'Excelente trabalho. Equipamentos em conformidade.',
        createdAt: getDate(35),
        updatedAt: getDate(35)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.maria,
        date: getDate(28),
        status: 'completed',
        conclusion: 'Inspeção semanal. Sistema operando normalmente.',
        managerNotes: null,
        createdAt: getDate(28),
        updatedAt: getDate(28)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.joao,
        date: getDate(21),
        status: 'completed',
        conclusion: 'Verificação completa. Substituído o-ring da bomba de recirculação.',
        managerNotes: 'Registrar peça substituída no inventário.',
        createdAt: getDate(21),
        updatedAt: getDate(21)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(14),
        status: 'completed',
        conclusion: 'Sistema em excelentes condições. Água cristalina.',
        managerNotes: null,
        createdAt: getDate(14),
        updatedAt: getDate(14)
      },
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.maria,
        date: getDate(7),
        status: 'completed',
        conclusion: 'Última inspeção semanal. Todos os parâmetros conformes.',
        managerNotes: null,
        createdAt: getDate(7),
        updatedAt: getDate(7)
      },

      // System 3: Torre de Resfriamento 1 - inspections with issues
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(45),
        status: 'completed',
        conclusion: 'Inspeção de rotina. Detectada leve incrustação nas placas de troca térmica.',
        managerNotes: 'Agendar limpeza química para próxima semana.',
        createdAt: getDate(45),
        updatedAt: getDate(45)
      },
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.joao,
        date: getDate(38),
        status: 'completed',
        conclusion: 'Inspeção corretiva após detecção de problema. Realizada limpeza química das placas.',
        managerNotes: 'Problema corrigido com sucesso.',
        createdAt: getDate(38),
        updatedAt: getDate(38)
      },
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(30),
        status: 'viewed',
        conclusion: 'Verificação pós-limpeza. Eficiência de troca térmica restaurada.',
        managerNotes: 'Excelente recuperação do sistema.',
        createdAt: getDate(30),
        updatedAt: getDate(30)
      },
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.maria,
        date: getDate(15),
        status: 'completed',
        conclusion: 'Inspeção quinzenal. Sistema operando em condições ótimas.',
        managerNotes: null,
        createdAt: getDate(15),
        updatedAt: getDate(15)
      },
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.joao,
        date: getDate(5),
        status: 'completed',
        conclusion: 'Inspeção de emergência após alarme de contagem bacteriana. Biocida de choque aplicado.',
        managerNotes: 'Monitorar resultados da análise microbiológica.',
        createdAt: getDate(5),
        updatedAt: getDate(4)
      },

      // System 5: Caldeira
      {
        systemId: systemMap.caldeira,
        stageId: null,
        userId: userMap.joao,
        date: getDate(50),
        status: 'viewed',
        conclusion: 'Inspeção mensal de caldeira. Verificados válvulas de segurança e instrumentação.',
        managerNotes: 'Todos os itens de segurança em conformidade.',
        createdAt: getDate(50),
        updatedAt: getDate(50)
      },
      {
        systemId: systemMap.caldeira,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(20),
        status: 'viewed',
        conclusion: 'Inspeção de segurança. Testadas todas as válvulas de alívio. Conformes.',
        managerNotes: 'Aprovado sem ressalvas.',
        createdAt: getDate(20),
        updatedAt: getDate(20)
      },

      // System 6: ETA
      {
        systemId: systemMap.eta,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(40),
        status: 'completed',
        conclusion: 'Inspeção semanal da ETA. Floculadores operando bem. Decantadores limpos.',
        managerNotes: null,
        createdAt: getDate(40),
        updatedAt: getDate(40)
      },
      {
        systemId: systemMap.eta,
        stageId: null,
        userId: userMap.maria,
        date: getDate(25),
        status: 'completed',
        conclusion: 'Verificação dos filtros. Realizada retrolavagem programada.',
        managerNotes: null,
        createdAt: getDate(25),
        updatedAt: getDate(25)
      },
      {
        systemId: systemMap.eta,
        stageId: null,
        userId: userMap.joao,
        date: getDate(10),
        status: 'viewed',
        conclusion: 'Inspeção regulatória mensal. Todos os parâmetros dentro dos limites da Portaria.',
        managerNotes: 'Documentação arquivada para fiscalização.',
        createdAt: getDate(10),
        updatedAt: getDate(10)
      },

      // System 7: ETE
      {
        systemId: systemMap.ete,
        stageId: null,
        userId: userMap.maria,
        date: getDate(35),
        status: 'completed',
        conclusion: 'Inspeção do sistema biológico. Lodo ativado com boa sedimentabilidade.',
        managerNotes: null,
        createdAt: getDate(35),
        updatedAt: getDate(35)
      },
      {
        systemId: systemMap.ete,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(18),
        status: 'completed',
        conclusion: 'Verificação dos aeradores. Sistema de aeração funcionando corretamente.',
        managerNotes: null,
        createdAt: getDate(18),
        updatedAt: getDate(18)
      },
      {
        systemId: systemMap.ete,
        stageId: null,
        userId: userMap.joao,
        date: getDate(3),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: getDate(3),
        updatedAt: getDate(3)
      },

      // Pending inspections (created today or in the past, waiting to be completed)
      {
        systemId: systemMap.piscina,
        stageId: null,
        userId: userMap.pedro,
        date: getDate(0),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: getDate(1),
        updatedAt: getDate(1)
      },
      {
        systemId: systemMap.torre,
        stageId: null,
        userId: userMap.maria,
        date: getDate(1),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: getDate(2),
        updatedAt: getDate(2)
      },
      {
        systemId: systemMap.caldeira,
        stageId: null,
        userId: userMap.joao,
        date: getDate(2),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: getDate(3),
        updatedAt: getDate(3)
      }
    ];

    await queryInterface.bulkInsert('Inspections', inspections, {});

    // Get inserted inspections and checklist items
    const insertedInspections = await queryInterface.sequelize.query(
      'SELECT id, "systemId", status FROM "Inspections" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const checklistItems = await queryInterface.sequelize.query(
      'SELECT id, "systemId" FROM "ChecklistItems" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create inspection items for completed inspections
    const inspectionItems = [];

    for (const inspection of insertedInspections) {
      if (inspection.status === 'completed' || inspection.status === 'viewed') {
        const systemChecklistItems = checklistItems.filter(ci => ci.systemId === inspection.systemId);

        for (const item of systemChecklistItems) {
          const random = Math.random();
          let status;
          if (random > 0.2) {
            status = 'C'; // Conforme (was 'pass')
          } else if (random > 0.1) {
            status = 'NC'; // Non-Conforme (was 'fail')
          } else if (random > 0.05) {
            status = 'NA'; // Not Applicable (was 'na')
          } else {
            status = 'NV'; // Not Verified (new status)
          }

          inspectionItems.push({
            inspectionId: inspection.id,
            checklistItemId: item.id,
            status: status,
            comment: status === 'NC' ? 'Item requer atenção. Ação corretiva programada.' : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (inspectionItems.length > 0) {
      await queryInterface.bulkInsert('InspectionItems', inspectionItems, {});
    }

    // Reset sequences to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Inspections"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Inspections"), 0),
        true
      );
    `);
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"InspectionItems"', 'id'),
        COALESCE((SELECT MAX(id) FROM "InspectionItems"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('InspectionItems', null, {});
    await queryInterface.bulkDelete('Inspections', null, {});
  }
};
