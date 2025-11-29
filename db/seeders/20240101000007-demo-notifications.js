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

    // Notification types: 'alert', 'incident', 'inspection', 'stock', 'system'
    // Priority: 'low', 'medium', 'high', 'critical'

    const notifications = [
      // Notifications for Manager 1 (Carlos - userId: 1)
      {
        userId: 1,
        type: 'incident',
        title: 'CRÍTICO: Alerta de Legionella',
        message: 'Contagem de Legionella acima do limite na Torre de Resfriamento 1. Ação imediata necessária.',
        priority: 'critical',
        isRead: true,
        readAt: getDate(5, 10),
        referenceType: 'Incident',
        referenceId: 3,
        createdAt: getDate(5, 10),
        updatedAt: getDate(5, 10)
      },
      {
        userId: 1,
        type: 'incident',
        title: 'Incidente Resolvido',
        message: 'O incidente "Alerta de Legionella na torre de resfriamento" foi resolvido com sucesso.',
        priority: 'medium',
        isRead: true,
        readAt: getDate(3, 17),
        referenceType: 'Incident',
        referenceId: 3,
        createdAt: getDate(3, 16),
        updatedAt: getDate(3, 17)
      },
      {
        userId: 1,
        type: 'inspection',
        title: 'Inspeção Programada',
        message: 'Inspeção de segurança da Caldeira de Vapor agendada para os próximos 10 dias.',
        priority: 'medium',
        isRead: false,
        readAt: null,
        referenceType: 'Inspection',
        referenceId: 25,
        createdAt: getDate(0, 8),
        updatedAt: getDate(0, 8)
      },
      {
        userId: 1,
        type: 'stock',
        title: 'Alerta de Estoque Baixo',
        message: 'Estoque de Hipoclorito de Sódio 12% está abaixo do nível mínimo (100L restantes).',
        priority: 'high',
        isRead: false,
        readAt: null,
        referenceType: 'Product',
        referenceId: 1,
        createdAt: getDate(1, 9),
        updatedAt: getDate(1, 9)
      },
      {
        userId: 1,
        type: 'alert',
        title: 'Parâmetro Fora do Limite',
        message: 'pH da Piscina Olímpica medido em 7.9, acima do limite máximo de 7.8.',
        priority: 'high',
        isRead: true,
        readAt: getDate(6, 15),
        referenceType: 'System',
        referenceId: 1,
        createdAt: getDate(7, 10),
        updatedAt: getDate(6, 15)
      },

      // Notifications for Manager 2 (Ana - userId: 2)
      {
        userId: 2,
        type: 'incident',
        title: 'Novo Incidente Reportado',
        message: 'Vibração excessiva detectada no ventilador da Torre de Resfriamento 1.',
        priority: 'medium',
        isRead: true,
        readAt: getDate(3, 9),
        referenceType: 'Incident',
        referenceId: 9,
        createdAt: getDate(3, 8),
        updatedAt: getDate(3, 9)
      },
      {
        userId: 2,
        type: 'inspection',
        title: 'Inspeção Concluída',
        message: 'Inspeção regulatória da ETA Principal concluída com sucesso.',
        priority: 'low',
        isRead: true,
        readAt: getDate(10, 12),
        referenceType: 'Inspection',
        referenceId: 18,
        createdAt: getDate(10, 11),
        updatedAt: getDate(10, 12)
      },
      {
        userId: 2,
        type: 'stock',
        title: 'Alerta de Estoque Baixo',
        message: 'Estoque de Bactericida Industrial THPS está abaixo do nível mínimo.',
        priority: 'high',
        isRead: false,
        readAt: null,
        referenceType: 'Product',
        referenceId: 10,
        createdAt: getDate(2, 14),
        updatedAt: getDate(2, 14)
      },

      // Notifications for Technician 1 (Pedro - userId: 3)
      {
        userId: 3,
        type: 'incident',
        title: 'Tarefa Atribuída',
        message: 'Você foi designado para resolver o incidente de dureza elevada na caldeira.',
        priority: 'high',
        isRead: true,
        readAt: getDate(12, 8),
        referenceType: 'Incident',
        referenceId: 5,
        createdAt: getDate(12, 7),
        updatedAt: getDate(12, 8)
      },
      {
        userId: 3,
        type: 'inspection',
        title: 'Lembrete de Inspeção',
        message: 'Inspeção semanal da Piscina Olímpica programada para amanhã.',
        priority: 'medium',
        isRead: false,
        readAt: null,
        referenceType: 'Inspection',
        referenceId: 23,
        createdAt: getDate(0, 8),
        updatedAt: getDate(0, 8)
      },
      {
        userId: 3,
        type: 'alert',
        title: 'Turbidez Elevada Detectada',
        message: 'Turbidez da água bruta na ETA Principal acima de 100 NTU.',
        priority: 'high',
        isRead: true,
        readAt: getDate(20, 7),
        referenceType: 'System',
        referenceId: 6,
        createdAt: getDate(20, 6),
        updatedAt: getDate(20, 7)
      },
      {
        userId: 3,
        type: 'system',
        title: 'Lembrete de Registro',
        message: 'Não se esqueça de registrar os dados diários da Piscina Olímpica.',
        priority: 'low',
        isRead: true,
        readAt: getDate(1, 9),
        referenceType: 'System',
        referenceId: 1,
        createdAt: getDate(1, 7),
        updatedAt: getDate(1, 9)
      },

      // Notifications for Technician 2 (Maria - userId: 4)
      {
        userId: 4,
        type: 'incident',
        title: 'Tarefa Atribuída',
        message: 'Você foi designada para o tratamento de Legionella na Torre de Resfriamento 1.',
        priority: 'critical',
        isRead: true,
        readAt: getDate(5, 11),
        referenceType: 'Incident',
        referenceId: 3,
        createdAt: getDate(5, 10),
        updatedAt: getDate(5, 11)
      },
      {
        userId: 4,
        type: 'inspection',
        title: 'Lembrete de Inspeção',
        message: 'Inspeção quinzenal da Torre de Resfriamento 1 programada para esta semana.',
        priority: 'medium',
        isRead: false,
        readAt: null,
        referenceType: 'Inspection',
        referenceId: 24,
        createdAt: getDate(0, 8),
        updatedAt: getDate(0, 8)
      },
      {
        userId: 4,
        type: 'incident',
        title: 'Atualização de Incidente',
        message: 'Novo comentário adicionado ao incidente de vibração do ventilador.',
        priority: 'low',
        isRead: true,
        readAt: getDate(2, 11),
        referenceType: 'Incident',
        referenceId: 9,
        createdAt: getDate(2, 10),
        updatedAt: getDate(2, 11)
      },
      {
        userId: 4,
        type: 'alert',
        title: 'DQO Elevada na ETE',
        message: 'DQO de entrada da ETE Industrial acima do esperado. Verificar fonte.',
        priority: 'medium',
        isRead: true,
        readAt: getDate(8, 10),
        referenceType: 'System',
        referenceId: 7,
        createdAt: getDate(8, 9),
        updatedAt: getDate(8, 10)
      },

      // Notifications for Technician 3 (João - userId: 5)
      {
        userId: 5,
        type: 'incident',
        title: 'Tarefa Atribuída',
        message: 'Você foi designado para reparar a bomba dosadora de cloro da Piscina Olímpica.',
        priority: 'high',
        isRead: true,
        readAt: getDate(25, 10),
        referenceType: 'Incident',
        referenceId: 1,
        createdAt: getDate(25, 9),
        updatedAt: getDate(25, 10)
      },
      {
        userId: 5,
        type: 'incident',
        title: 'Nova Tarefa',
        message: 'Você foi designado para a limpeza química da Torre de Resfriamento 2.',
        priority: 'medium',
        isRead: true,
        readAt: getDate(2, 15),
        referenceType: 'Incident',
        referenceId: 4,
        createdAt: getDate(2, 14),
        updatedAt: getDate(2, 15)
      },
      {
        userId: 5,
        type: 'inspection',
        title: 'Inspeção de Segurança',
        message: 'Inspeção de segurança mensal da Caldeira de Vapor próxima.',
        priority: 'high',
        isRead: false,
        readAt: null,
        referenceType: 'Inspection',
        referenceId: 25,
        createdAt: getDate(0, 8),
        updatedAt: getDate(0, 8)
      },
      {
        userId: 5,
        type: 'system',
        title: 'Registro Pendente',
        message: 'Registro diário da Piscina de Hidroterapia ainda não foi preenchido.',
        priority: 'medium',
        isRead: false,
        readAt: null,
        referenceType: 'System',
        referenceId: 3,
        createdAt: getDate(0, 14),
        updatedAt: getDate(0, 14)
      },

      // General system notifications
      {
        userId: 1,
        type: 'system',
        title: 'Relatório Mensal Disponível',
        message: 'O relatório mensal de qualidade da água de novembro está disponível para download.',
        priority: 'low',
        isRead: false,
        readAt: null,
        referenceType: null,
        referenceId: null,
        createdAt: getDate(0, 6),
        updatedAt: getDate(0, 6)
      },
      {
        userId: 2,
        type: 'system',
        title: 'Relatório Mensal Disponível',
        message: 'O relatório mensal de qualidade da água de novembro está disponível para download.',
        priority: 'low',
        isRead: false,
        readAt: null,
        referenceType: null,
        referenceId: null,
        createdAt: getDate(0, 6),
        updatedAt: getDate(0, 6)
      },
      {
        userId: 1,
        type: 'system',
        title: 'Manutenção Programada',
        message: 'Manutenção preventiva da ETA Principal agendada para o dia 15.',
        priority: 'medium',
        isRead: true,
        readAt: getDate(4, 10),
        referenceType: 'System',
        referenceId: 6,
        createdAt: getDate(5, 9),
        updatedAt: getDate(4, 10)
      }
    ];

    await queryInterface.bulkInsert('Notifications', notifications, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};
