const { DailyLog, DailyLogEntry, MonitoringPoint, Inspection, InspectionItem, InspectionPhoto, Incident, IncidentPhoto, IncidentComment, System, User, Product, ProductUsage, ChecklistItem } = require('../../db/models');
const { Op } = require('sequelize');

const reportController = {
  async generate(req, res, next) {
    try {
      const { type, systemIds, stageIds, startDate, endDate } = req.body;

      // Calculate date range based on type
      let start, end;
      const now = new Date();

      switch (type) {
        case 'daily':
          start = new Date(now.toISOString().split('T')[0]);
          end = new Date(start);
          end.setDate(end.getDate() + 1);
          break;
        case 'weekly':
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          end = new Date(now);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            return res.status(400).json({
              success: false,
              messageKey: 'reports.errors.datesRequired'
            });
          }
          start = new Date(startDate);
          end = new Date(endDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            messageKey: 'reports.errors.invalidType'
          });
      }

      // Build system filter
      const systemFilter = systemIds && systemIds.length > 0
        ? { systemId: { [Op.in]: systemIds } }
        : {};

      // Build stage filter
      const stageFilter = stageIds && stageIds.length > 0
        ? { stageId: { [Op.in]: stageIds } }
        : {};

      // Fetch daily logs with all associations
      const dailyLogs = await DailyLog.findAll({
        where: {
          date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'user' },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      // Fetch inspections with all associations
      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'user' },
          { model: System, as: 'system' },
          {
            model: InspectionItem,
            as: 'items',
            include: [{ model: ChecklistItem, as: 'checklistItem' }]
          },
          { model: InspectionPhoto, as: 'photos' }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      // Fetch incidents with all associations
      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...systemFilter,
          ...stageFilter
        },
        include: [
          { model: User, as: 'reporter' },
          { model: User, as: 'assignee' },
          { model: System, as: 'system' },
          { model: IncidentPhoto, as: 'photos' },
          {
            model: IncidentComment,
            as: 'comments',
            include: [{ model: User, as: 'user' }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Fetch all products with current stock
      const products = await Product.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']]
      });

      // Fetch product usages filtered by date range and optionally by system
      const productUsageFilter = {
        date: { [Op.between]: [start, end] }
      };
      if (systemIds && systemIds.length > 0) {
        productUsageFilter.systemId = { [Op.in]: systemIds };
      }

      const productUsages = await ProductUsage.findAll({
        where: productUsageFilter,
        include: [
          { model: Product, as: 'product' },
          { model: User, as: 'user' },
          { model: System, as: 'system' }
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      const report = {
        type,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        dailyLogs,
        inspections,
        incidents,
        products,
        productUsages,
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  async exportPDF(req, res, next) {
    try {
      const { type, systemIds, startDate, endDate } = req.body;

      // Generate report data first
      const reportData = await generateReportData(type, systemIds, startDate, endDate);

      // Create simple HTML for PDF
      const translateSt = (s) => ({ open:'Aberto',in_progress:'Em Andamento',resolved:'Resolvido',closed:'Fechado',pending:'Pendente',completed:'Concluído',viewed:'Visualizado',active:'Ativo',inactive:'Inativo' }[s] || s || '-');
      const translatePr = (p) => ({ low:'Baixa',medium:'Média',high:'Alta',critical:'Crítica' }[p] || p || '-');
      const translateTy = (t) => ({ in:'Entrada',out:'Saída' }[t] || t || '-');
      const typeLabel = { daily:'Diário',weekly:'Semanal',monthly:'Mensal',system:'Por Sistema' }[type] || type;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>LINCE Relatório - ${typeLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
            h1 { color: #1a56db; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>LINCE — Relatório de Tratamento de Água</h1>
          <p><strong>Tipo:</strong> ${typeLabel}</p>
          <p><strong>Período:</strong> ${reportData.period.startDate} até ${reportData.period.endDate}</p>
          <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>

          <h2>Resumo</h2>
          <table>
            <tr>
              <th>Total de Leituras</th>
              <th>Fora do Limite</th>
              <th>Inspeções</th>
              <th>Ocorrências</th>
              <th>Produtos</th>
              <th>Uso de Produtos</th>
            </tr>
            <tr>
              <td>${reportData.summary.totalReadings}</td>
              <td>${reportData.summary.outOfRangeCount}</td>
              <td>${reportData.summary.inspectionsCount}</td>
              <td>${reportData.summary.incidentsCount}</td>
              <td>${reportData.summary.productsCount}</td>
              <td>${reportData.summary.productUsagesCount}</td>
            </tr>
          </table>

          <h2>Registros Diários (${reportData.dailyLogs.length})</h2>
          <table>
            <tr>
              <th>Data</th>
              <th>Sistema</th>
              <th>Usuário</th>
              <th>Entradas</th>
              <th>Observações</th>
            </tr>
            ${reportData.dailyLogs.map(log => `
              <tr>
                <td>${new Date(log.date).toLocaleDateString('pt-BR')}</td>
                <td>${log.system?.name || '-'}</td>
                <td>${log.user?.name || '-'}</td>
                <td>${log.entries?.length || 0}</td>
                <td>${log.notes || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Inspeções (${reportData.inspections.length})</h2>
          <table>
            <tr>
              <th>Data</th>
              <th>Sistema</th>
              <th>Usuário</th>
              <th>Status</th>
              <th>Itens</th>
            </tr>
            ${reportData.inspections.map(insp => `
              <tr>
                <td>${new Date(insp.date).toLocaleDateString('pt-BR')}</td>
                <td>${insp.system?.name || '-'}</td>
                <td>${insp.user?.name || '-'}</td>
                <td>${translateSt(insp.status)}</td>
                <td>${insp.items?.length || 0}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Ocorrências (${reportData.incidents.length})</h2>
          <table>
            <tr>
              <th>Título</th>
              <th>Sistema</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Reportado por</th>
            </tr>
            ${reportData.incidents.map(inc => `
              <tr>
                <td>${inc.title}</td>
                <td>${inc.system?.name || '-'}</td>
                <td>${translatePr(inc.priority)}</td>
                <td>${translateSt(inc.status)}</td>
                <td>${inc.reporter?.name || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Produtos (${reportData.products.length})</h2>
          <table>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Estoque Atual</th>
              <th>Unidade</th>
              <th>Alerta Mínimo</th>
            </tr>
            ${reportData.products.map(prod => `
              <tr>
                <td>${prod.name}</td>
                <td>${prod.type}</td>
                <td>${prod.currentStock}</td>
                <td>${prod.unit}</td>
                <td>${prod.minStockAlert || '-'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Uso de Produtos (${reportData.productUsages.length})</h2>
          <table>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Sistema</th>
              <th>Usuário</th>
            </tr>
            ${reportData.productUsages.map(usage => `
              <tr>
                <td>${new Date(usage.date).toLocaleDateString('pt-BR')}</td>
                <td>${usage.product?.name || '-'}</td>
                <td>${translateTy(usage.type)}</td>
                <td>${usage.quantity}</td>
                <td>${usage.system?.name || '-'}</td>
                <td>${usage.user?.name || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      // Set headers for HTML download (client can print to PDF)
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.html`);
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  async exportCSV(req, res, next) {
    try {
      const { type, systemIds, startDate, endDate } = req.body;

      const translateStatus = (s) => ({ open: 'Aberto', in_progress: 'Em Andamento', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
      const translatePriority = (p) => ({ critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);
      const translateInspStatus = (s) => ({ pending: 'Pendente', completed: 'Concluído', failed: 'Reprovado' }[s] || s);
      const translateProductType = (t) => ({ chemical: 'Químico', equipment: 'Equipamento', consumable: 'Consumível', other: 'Outro' }[t] || t);
      const translateUsageType = (t) => ({ stock_in: 'Entrada', stock_out: 'Saída' }[t] || t);

      // Generate report data first
      const reportData = await generateReportData(type, systemIds, startDate, endDate);

      // Create CSV content
      let csv = 'Relatório LINCE\n';
      csv += `Tipo,${type}\n`;
      csv += `Período,${reportData.period.startDate} até ${reportData.period.endDate}\n`;
      csv += `Gerado,${new Date().toISOString()}\n\n`;

      csv += 'Resumo\n';
      csv += 'Total de Leituras,Fora do Intervalo,Inspeções,Ocorrências,Produtos,Uso de Produtos\n';
      csv += `${reportData.summary.totalReadings},${reportData.summary.outOfRangeCount},${reportData.summary.inspectionsCount},${reportData.summary.incidentsCount},${reportData.summary.productsCount},${reportData.summary.productUsagesCount}\n\n`;

      csv += 'Registros Diários\n';
      csv += 'Data,Sistema,Usuário,Entradas,Observações\n';
      reportData.dailyLogs.forEach(log => {
        csv += `"${log.date}","${log.system?.name || ''}","${log.user?.name || ''}",${log.entries?.length || 0},"${(log.notes || '').replace(/"/g, '""')}"\n`;
      });

      csv += '\nInspeções\n';
      csv += 'Data,Sistema,Usuário,Status,Itens\n';
      reportData.inspections.forEach(insp => {
        csv += `"${new Date(insp.date).toLocaleDateString()}","${insp.system?.name || ''}","${insp.user?.name || ''}","${translateInspStatus(insp.status)}",${insp.items?.length || 0}\n`;
      });

      csv += '\nOcorrências\n';
      csv += 'Título,Sistema,Prioridade,Status,Reportado Por\n';
      reportData.incidents.forEach(inc => {
        csv += `"${(inc.title || '').replace(/"/g, '""')}","${inc.system?.name || ''}","${translatePriority(inc.priority)}","${translateStatus(inc.status)}","${inc.reporter?.name || ''}"\n`;
      });

      csv += '\nProdutos\n';
      csv += 'Nome,Tipo,Estoque Atual,Unidade,Alerta Mínimo\n';
      reportData.products.forEach(prod => {
        csv += `"${prod.name}","${translateProductType(prod.type)}",${prod.currentStock},"${prod.unit}",${prod.minStockAlert || ''}\n`;
      });

      csv += '\nUso de Produtos\n';
      csv += 'Data,Produto,Tipo,Quantidade,Sistema,Usuário\n';
      reportData.productUsages.forEach(usage => {
        csv += `"${new Date(usage.date).toLocaleDateString()}","${usage.product?.name || ''}","${translateUsageType(usage.type)}",${usage.quantity},"${usage.system?.name || ''}","${usage.user?.name || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  async getDailyReport(req, res, next) {
    try {
      const { date, systemId } = req.query;
      const reportDate = date || new Date().toISOString().split('T')[0];

      const where = { date: reportDate };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: {
            [Op.gte]: new Date(reportDate),
            [Op.lt]: new Date(new Date(reportDate).getTime() + 24 * 60 * 60 * 1000)
          },
          ...(systemId && { systemId })
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(reportDate),
            [Op.lt]: new Date(new Date(reportDate).getTime() + 24 * 60 * 60 * 1000)
          },
          ...(systemId && { systemId })
        },
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ]
      });

      const outOfRangeCount = dailyLogs.reduce((acc, log) => {
        return acc + log.entries.filter(e => e.isOutOfRange).length;
      }, 0);

      res.json({
        success: true,
        data: {
          date: reportDate,
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            outOfRangeReadings: outOfRangeCount
          },
          dailyLogs,
          inspections,
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyReport(req, res, next) {
    try {
      const { startDate, systemId } = req.query;
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const where = {
        date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] }
      };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'ASC']]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const dailyData = {};
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        dailyData[dayStr] = {
          logs: dailyLogs.filter(l => l.date === dayStr).length,
          inspections: inspections.filter(i => i.date.toISOString().split('T')[0] === dayStr).length,
          incidents: incidents.filter(i => i.createdAt.toISOString().split('T')[0] === dayStr).length
        };
      }

      res.json({
        success: true,
        data: {
          period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            openIncidents: incidents.filter(i => i.status === 'open').length,
            resolvedIncidents: incidents.filter(i => i.status === 'resolved').length
          },
          dailyData,
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyReport(req, res, next) {
    try {
      const { month, year, systemId } = req.query;
      const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      const reportYear = year ? parseInt(year) : new Date().getFullYear();

      const start = new Date(reportYear, reportMonth, 1);
      const end = new Date(reportYear, reportMonth + 1, 0);

      const where = {
        date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] }
      };
      if (systemId) where.systemId = systemId;

      const dailyLogs = await DailyLog.findAll({
        where,
        include: [
          { model: System, as: 'system' },
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ]
      });

      const inspections = await Inspection.findAll({
        where: {
          date: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const incidents = await Incident.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] },
          ...(systemId && { systemId })
        },
        include: [{ model: System, as: 'system' }]
      });

      const averages = {};
      dailyLogs.forEach(log => {
        log.entries.forEach(entry => {
          if (entry.monitoringPoint) {
            const key = `${entry.monitoringPoint.systemId}-${entry.monitoringPoint.name}`;
            if (!averages[key]) {
              averages[key] = {
                systemId: entry.monitoringPoint.systemId,
                name: entry.monitoringPoint.name,
                unit: entry.monitoringPoint.unit,
                values: [],
                outOfRange: 0
              };
            }
            averages[key].values.push(parseFloat(entry.value));
            if (entry.isOutOfRange) averages[key].outOfRange++;
          }
        });
      });

      Object.keys(averages).forEach(key => {
        const values = averages[key].values;
        averages[key].average = values.reduce((a, b) => a + b, 0) / values.length;
        averages[key].min = Math.min(...values);
        averages[key].max = Math.max(...values);
        averages[key].count = values.length;
        delete averages[key].values;
      });

      res.json({
        success: true,
        data: {
          period: {
            month: reportMonth + 1,
            year: reportYear,
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          summary: {
            totalLogs: dailyLogs.length,
            totalInspections: inspections.length,
            totalIncidents: incidents.length,
            approvedInspections: inspections.filter(i => i.status === 'approved').length
          },
          averages: Object.values(averages),
          incidentsByPriority: {
            critical: incidents.filter(i => i.priority === 'critical').length,
            high: incidents.filter(i => i.priority === 'high').length,
            medium: incidents.filter(i => i.priority === 'medium').length,
            low: incidents.filter(i => i.priority === 'low').length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSystemReport(req, res, next) {
    try {
      const { systemId } = req.params;
      const { startDate, endDate } = req.query;

      const system = await System.findByPk(systemId, {
        include: [{ model: MonitoringPoint, as: 'monitoringPoints' }]
      });

      if (!system) {
        return res.status(404).json({
          success: false,
          messageKey: 'systems.errors.notFound'
        });
      }

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = { [Op.between]: [startDate, endDate] };
      }

      const dailyLogs = await DailyLog.findAll({
        where: { systemId, ...dateFilter },
        include: [
          {
            model: DailyLogEntry,
            as: 'entries',
            include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
          }
        ],
        order: [['date', 'DESC']],
        limit: 30
      });

      const inspections = await Inspection.findAll({
        where: { systemId },
        order: [['date', 'DESC']],
        limit: 10
      });

      const incidents = await Incident.findAll({
        where: { systemId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          system,
          recentLogs: dailyLogs,
          recentInspections: inspections,
          recentIncidents: incidents,
          summary: {
            totalMonitoringPoints: system.monitoringPoints.length,
            openIncidents: incidents.filter(i => i.status === 'open').length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to generate report data
async function generateReportData(type, systemIds, startDate, endDate) {
  let start, end;
  const now = new Date();

  switch (type) {
    case 'daily':
      start = new Date(now.toISOString().split('T')[0]);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = new Date(now);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'custom':
      start = new Date(startDate);
      end = new Date(endDate);
      break;
  }

  const systemFilter = systemIds && systemIds.length > 0
    ? { systemId: { [Op.in]: systemIds } }
    : {};

  // Fetch daily logs with all associations
  const dailyLogs = await DailyLog.findAll({
    where: {
      date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'user' },
      { model: System, as: 'system' },
      {
        model: DailyLogEntry,
        as: 'entries',
        include: [{ model: MonitoringPoint, as: 'monitoringPoint' }]
      }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Fetch inspections with all associations
  const inspections = await Inspection.findAll({
    where: {
      date: { [Op.between]: [start, end] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'user' },
      { model: System, as: 'system' },
      {
        model: InspectionItem,
        as: 'items',
        include: [{ model: ChecklistItem, as: 'checklistItem' }]
      },
      { model: InspectionPhoto, as: 'photos' }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Fetch incidents with all associations
  const incidents = await Incident.findAll({
    where: {
      createdAt: { [Op.between]: [start, end] },
      ...systemFilter
    },
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'assignee' },
      { model: System, as: 'system' },
      { model: IncidentPhoto, as: 'photos' },
      {
        model: IncidentComment,
        as: 'comments',
        include: [{ model: User, as: 'user' }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Fetch all products with current stock
  const products = await Product.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });

  // Fetch product usages filtered by date range and optionally by system
  const productUsageFilter = {
    date: { [Op.between]: [start, end] }
  };
  if (systemIds && systemIds.length > 0) {
    productUsageFilter.systemId = { [Op.in]: systemIds };
  }

  const productUsages = await ProductUsage.findAll({
    where: productUsageFilter,
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'user' },
      { model: System, as: 'system' }
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']]
  });

  // Calculate summary for export functions
  let totalReadings = 0;
  let outOfRangeCount = 0;
  dailyLogs.forEach(log => {
    totalReadings += log.entries?.length || 0;
    outOfRangeCount += log.entries?.filter(e => e.isOutOfRange).length || 0;
  });

  return {
    type,
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    },
    dailyLogs,
    inspections,
    incidents,
    products,
    productUsages,
    summary: {
      totalReadings,
      outOfRangeCount,
      inspectionsCount: inspections.length,
      incidentsCount: incidents.length,
      productsCount: products.length,
      productUsagesCount: productUsages.length
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = reportController;
