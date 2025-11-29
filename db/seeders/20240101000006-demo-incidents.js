'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo, hours = 12) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
      return date;
    };

    const incidents = [
      // Incident 1: Resolved - Chlorine pump failure
      {
        systemId: 1,
        userId: 3,
        title: 'Falha na bomba dosadora de cloro',
        description: 'Bomba dosadora de cloro parou de funcionar durante operação normal. Detectado pela queda nos níveis de cloro residual. Possível falha no diafragma.',
        priority: 'high',
        status: 'resolved',
        assignedTo: 5,
        resolvedAt: getDate(24, 14),
        resolution: 'Substituído diafragma da bomba dosadora. Realizada calibração e teste de funcionamento. Sistema normalizado.',
        createdAt: getDate(25, 9),
        updatedAt: getDate(24, 14)
      },
      // Incident 2: Resolved - pH out of range
      {
        systemId: 2,
        userId: 4,
        title: 'pH da piscina infantil fora do padrão',
        description: 'pH medido em 8.2, acima do limite máximo de 7.8. Possível causa: dosagem excessiva de barrilha no dia anterior.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: 3,
        resolvedAt: getDate(20, 11),
        resolution: 'Aplicado ácido clorídrico para correção do pH. Valor normalizado para 7.4. Ajustada dosagem automática.',
        createdAt: getDate(20, 8),
        updatedAt: getDate(20, 11)
      },
      // Incident 3: Resolved - Legionella alert
      {
        systemId: 3,
        userId: 5,
        title: 'Alerta de Legionella na torre de resfriamento',
        description: 'Contagem de Legionella pneumophila acima de 1000 UFC/L detectada na análise mensal. Requer tratamento imediato conforme protocolo de segurança.',
        priority: 'critical',
        status: 'resolved',
        assignedTo: 4,
        resolvedAt: getDate(3, 16),
        resolution: 'Realizado tratamento de choque com biocida oxidante. Aumentada purga do sistema. Limpeza das bandejas. Nova análise confirmou níveis abaixo de 100 UFC/L.',
        createdAt: getDate(5, 10),
        updatedAt: getDate(3, 16)
      },
      // Incident 4: In Progress - Scale buildup
      {
        systemId: 4,
        userId: 3,
        title: 'Incrustação detectada nas tubulações',
        description: 'Detectada incrustação de carbonato de cálcio nas tubulações de distribuição da torre 2. Delta de temperatura aumentando.',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 5,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(2, 14),
        updatedAt: getDate(1, 9)
      },
      // Incident 5: Resolved - Boiler water quality
      {
        systemId: 5,
        userId: 5,
        title: 'Dureza elevada na água de alimentação da caldeira',
        description: 'Dureza total medida em 15 mg/L CaCO3 na água de alimentação, acima do limite de 5 mg/L. Abrandador pode estar com problema de regeneração.',
        priority: 'high',
        status: 'resolved',
        assignedTo: 3,
        resolvedAt: getDate(11, 15),
        resolution: 'Identificado problema no timer de regeneração do abrandador. Substituído timer e realizada regeneração manual. Dureza normalizada para 0.5 mg/L.',
        createdAt: getDate(12, 7),
        updatedAt: getDate(11, 15)
      },
      // Incident 6: Resolved - WTP turbidity
      {
        systemId: 6,
        userId: 3,
        title: 'Turbidez elevada na água bruta',
        description: 'Turbidez da água bruta chegou a 150 NTU devido às fortes chuvas na região. Necessário ajuste no processo de tratamento.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: 4,
        resolvedAt: getDate(19, 18),
        resolution: 'Aumentada dosagem de coagulante de 25 para 40 mg/L. Adicionado polímero auxiliar. Turbidez da água tratada mantida em 0.5 NTU.',
        createdAt: getDate(20, 6),
        updatedAt: getDate(19, 18)
      },
      // Incident 7: Open - WWTP odor
      {
        systemId: 7,
        userId: 4,
        title: 'Odor característico no tanque de aeração',
        description: 'Detectado odor de sulfeto no tanque de aeração. Possível problema de oxigenação ou entrada de efluente com alta carga orgânica.',
        priority: 'low',
        status: 'open',
        assignedTo: null,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(1, 15),
        updatedAt: getDate(1, 15)
      },
      // Incident 8: Resolved - Pool filter issue
      {
        systemId: 1,
        userId: 5,
        title: 'Pressão elevada no filtro de areia',
        description: 'Manômetro do filtro indicando 2.5 bar, acima do limite de 2.0 bar. Necessária retrolavagem ou possível obstrução.',
        priority: 'low',
        status: 'resolved',
        assignedTo: 5,
        resolvedAt: getDate(15, 12),
        resolution: 'Realizada retrolavagem do filtro por 5 minutos. Pressão normalizada para 1.2 bar. Programada troca de areia para próxima manutenção.',
        createdAt: getDate(15, 10),
        updatedAt: getDate(15, 12)
      },
      // Incident 9: In Progress - Cooling tower fan
      {
        systemId: 3,
        userId: 3,
        title: 'Vibração excessiva no ventilador',
        description: 'Detectada vibração anormal no ventilador da torre de resfriamento 1. Possível desbalanceamento das pás ou problema nos rolamentos.',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 4,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(3, 8),
        updatedAt: getDate(2, 10)
      },
      // Incident 10: Resolved - Chemical spill
      {
        systemId: 6,
        userId: 4,
        title: 'Vazamento de ácido no sistema de dosagem',
        description: 'Pequeno vazamento detectado na mangueira de sucção da bomba de ácido. Aproximadamente 2L derramados na bacia de contenção.',
        priority: 'high',
        status: 'resolved',
        assignedTo: 3,
        resolvedAt: getDate(8, 13),
        resolution: 'Vazamento contido na bacia de contenção. Mangueira substituída. Área neutralizada com barrilha e lavada. Sem danos ambientais.',
        createdAt: getDate(8, 11),
        updatedAt: getDate(8, 13)
      }
    ];

    await queryInterface.bulkInsert('Incidents', incidents, {});

    // Get inserted incidents
    const insertedIncidents = await queryInterface.sequelize.query(
      'SELECT id, title, status FROM "Incidents" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create incident comments
    const incidentComments = [
      // Comments for Incident 1 (Chlorine pump)
      {
        incidentId: insertedIncidents[0].id,
        userId: 3,
        content: 'Bomba parou às 9h. Níveis de cloro caíram de 2.0 para 0.8 mg/L em 2 horas. Dosagem manual iniciada.',
        createdAt: getDate(25, 9),
        updatedAt: getDate(25, 9)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: 1,
        content: 'Autorizado compra de kit de reparo emergencial. Fornecedor confirmou entrega para amanhã.',
        createdAt: getDate(25, 11),
        updatedAt: getDate(25, 11)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: 5,
        content: 'Peças recebidas. Iniciando substituição do diafragma e válvulas.',
        createdAt: getDate(24, 10),
        updatedAt: getDate(24, 10)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: 5,
        content: 'Reparo concluído. Bomba funcionando normalmente. Cloro estabilizado em 1.8 mg/L.',
        createdAt: getDate(24, 14),
        updatedAt: getDate(24, 14)
      },

      // Comments for Incident 3 (Legionella)
      {
        incidentId: insertedIncidents[2].id,
        userId: 5,
        content: 'URGENTE: Resultado do laboratório indica 1.200 UFC/L de Legionella. Protocolo de emergência ativado.',
        createdAt: getDate(5, 10),
        updatedAt: getDate(5, 10)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: 1,
        content: 'Torre isolada do sistema de ar condicionado por precaução. Equipe de manutenção notificada.',
        createdAt: getDate(5, 11),
        updatedAt: getDate(5, 11)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: 4,
        content: 'Tratamento de choque iniciado com 50 ppm de cloro livre. Drenagem parcial realizada.',
        createdAt: getDate(5, 14),
        updatedAt: getDate(5, 14)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: 4,
        content: 'Segundo dia de tratamento. Cloro mantido em 20 ppm. Limpeza das bandejas em andamento.',
        createdAt: getDate(4, 10),
        updatedAt: getDate(4, 10)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: 4,
        content: 'Amostra coletada para nova análise. Resultado esperado para amanhã.',
        createdAt: getDate(4, 15),
        updatedAt: getDate(4, 15)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: 1,
        content: 'Resultado da nova análise: 85 UFC/L. Abaixo do limite de ação. Tratamento bem-sucedido.',
        createdAt: getDate(3, 16),
        updatedAt: getDate(3, 16)
      },

      // Comments for Incident 4 (Scale - in progress)
      {
        incidentId: insertedIncidents[3].id,
        userId: 3,
        content: 'Incrustação visível na inspeção visual. Delta T subiu de 8°C para 12°C.',
        createdAt: getDate(2, 14),
        updatedAt: getDate(2, 14)
      },
      {
        incidentId: insertedIncidents[3].id,
        userId: 5,
        content: 'Agendada limpeza química para o próximo final de semana. Necessário parada do sistema por 8h.',
        createdAt: getDate(1, 9),
        updatedAt: getDate(1, 9)
      },

      // Comments for Incident 5 (Boiler hardness)
      {
        incidentId: insertedIncidents[4].id,
        userId: 5,
        content: 'Teste de dureza confirmou 15 mg/L. Abrandador aparenta não estar regenerando corretamente.',
        createdAt: getDate(12, 8),
        updatedAt: getDate(12, 8)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: 3,
        content: 'Verificado timer de regeneração. Display não acende. Possível falha eletrônica.',
        createdAt: getDate(12, 14),
        updatedAt: getDate(12, 14)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: 3,
        content: 'Timer substituído. Regeneração manual realizada. Aguardando estabilização.',
        createdAt: getDate(11, 10),
        updatedAt: getDate(11, 10)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: 3,
        content: 'Dureza na saída do abrandador: 0.5 mg/L. Problema resolvido.',
        createdAt: getDate(11, 15),
        updatedAt: getDate(11, 15)
      },

      // Comments for Incident 7 (WWTP odor - open)
      {
        incidentId: insertedIncidents[6].id,
        userId: 4,
        content: 'Odor detectado durante inspeção de rotina. Oxigênio dissolvido medido: 1.5 mg/L (baixo).',
        createdAt: getDate(1, 15),
        updatedAt: getDate(1, 15)
      },

      // Comments for Incident 9 (Fan vibration - in progress)
      {
        incidentId: insertedIncidents[8].id,
        userId: 3,
        content: 'Vibração medida com acelerômetro: 8 mm/s. Limite é 4.5 mm/s. Precisa investigação.',
        createdAt: getDate(3, 8),
        updatedAt: getDate(3, 8)
      },
      {
        incidentId: insertedIncidents[8].id,
        userId: 4,
        content: 'Inspeção visual das pás não revelou danos. Suspeita de rolamentos. Orçamento solicitado.',
        createdAt: getDate(2, 10),
        updatedAt: getDate(2, 10)
      },

      // Comments for Incident 10 (Chemical spill)
      {
        incidentId: insertedIncidents[9].id,
        userId: 4,
        content: 'Vazamento identificado na conexão da mangueira. Área isolada imediatamente.',
        createdAt: getDate(8, 11),
        updatedAt: getDate(8, 11)
      },
      {
        incidentId: insertedIncidents[9].id,
        userId: 3,
        content: 'Mangueira substituída e conexões refeitas. Área neutralizada e limpa.',
        createdAt: getDate(8, 13),
        updatedAt: getDate(8, 13)
      }
    ];

    await queryInterface.bulkInsert('IncidentComments', incidentComments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('IncidentComments', null, {});
    await queryInterface.bulkDelete('Incidents', null, {});
  }
};
