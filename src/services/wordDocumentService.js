/**
 * Word Document Generation Service
 * Generates .docx reports using the docx library
 */
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip
} = require('docx');
const https = require('https');
const http = require('http');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

/**
 * Fetch image from URL and return as Buffer
 */
async function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        fetchImageBuffer(response.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Chart renderer instance (reusable)
 */
const chartRenderer = new ChartJSNodeCanvas({
  width: 600,
  height: 300,
  backgroundColour: 'white'
});

/**
 * Generate a chart image buffer from chart data
 * @param {Object} chartSeries - Chart series data from chartDataService
 * @param {Object} chartConfig - Chart configuration (colors, type, etc.)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateChartImage(chartSeries, chartConfig = {}) {
  const { chartType = 'bar', colors = {} } = chartConfig;
  const primaryColor = chartSeries.color || colors.primary || '#1976d2';

  // Prepare data
  const labels = chartSeries.data.map(d => d.label);
  const values = chartSeries.data.map(d => d.value);

  // Prepare min/max reference lines if available
  const datasets = [{
    label: chartSeries.parameterName || chartSeries.monitoringPointName,
    data: values,
    backgroundColor: chartType === 'bar' ? primaryColor + '80' : 'transparent',
    borderColor: primaryColor,
    borderWidth: chartType === 'line' ? 2 : 1,
    fill: chartType === 'line' ? false : undefined,
    tension: chartType === 'line' ? 0.3 : undefined
  }];

  // Add min/max reference lines
  if (chartSeries.minValue !== null && chartSeries.minValue !== undefined) {
    datasets.push({
      label: 'Min',
      data: Array(labels.length).fill(chartSeries.minValue),
      borderColor: '#f44336',
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
      type: 'line'
    });
  }

  if (chartSeries.maxValue !== null && chartSeries.maxValue !== undefined) {
    datasets.push({
      label: 'Max',
      data: Array(labels.length).fill(chartSeries.maxValue),
      borderColor: '#f44336',
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
      type: 'line'
    });
  }

  const configuration = {
    type: chartType,
    data: {
      labels,
      datasets
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: `${chartSeries.parameterName || chartSeries.monitoringPointName}${chartSeries.unit ? ` (${chartSeries.unit})` : ''}`,
          font: { size: 14, weight: 'bold' }
        },
        legend: {
          display: datasets.length > 1,
          position: 'bottom',
          labels: { font: { size: 10 } }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 10 } }
        }
      }
    }
  };

  return await chartRenderer.renderToBuffer(configuration);
}

/**
 * Format date string to locale date
 */
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString || '-';
  }
}

/**
 * Format date time string
 */
function formatDateTime(dateString) {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString || '-';
  }
}

/**
 * Create styled heading paragraph
 */
function createHeading(text, level = HeadingLevel.HEADING_1, options = {}) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 200 },
    ...options
  });
}

/**
 * Create styled paragraph with text
 */
function createParagraph(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...options.textOptions })],
    spacing: { after: 120 },
    ...options
  });
}

/**
 * Create info row (label: value format)
 */
function createInfoRow(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value || '-' })
    ],
    spacing: { after: 80 }
  });
}

/**
 * Create table with headers and data
 */
function createTable(headers, rows, options = {}) {
  const {
    headerBgColor = 'D4EDDA',
    cellPadding = 100,
    fontSize = 20 // in half-points (20 = 10pt)
  } = options;

  const headerRow = new TableRow({
    children: headers.map(header => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: header, bold: true, size: fontSize, color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER
      })],
      shading: { fill: '1976D2' },
      margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding }
    })),
    tableHeader: true
  });

  const dataRows = rows.map((row, rowIndex) => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text: String(cell ?? '-'),
          size: fontSize,
          color: cell?.isAlert ? 'DC2626' : undefined
        })]
      })],
      shading: rowIndex % 2 === 1 ? { fill: 'F9FAFB' } : undefined,
      margins: { top: cellPadding, bottom: cellPadding, left: cellPadding, right: cellPadding }
    }))
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

/**
 * Build Identification section
 */
function buildIdentificationSection(data, reportName, isServiceProvider) {
  const clientLabel = isServiceProvider ? 'Client' : 'Company';

  return [
    createHeading(reportName, HeadingLevel.HEADING_1),
    new Paragraph({
      children: [
        new TextRun({ text: 'Period: ', bold: true }),
        new TextRun({ text: `${formatDate(data.period?.startDate)} - ${formatDate(data.period?.endDate)}` })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),
    createHeading('Identification', HeadingLevel.HEADING_2),
    createInfoRow(clientLabel, data.client?.name),
    createInfoRow('Address', data.client?.address),
    createInfoRow('Contact', data.client?.contact),
    createInfoRow('Phone', data.client?.phone),
    createInfoRow('Email', data.client?.email),
    createInfoRow('Generated by', data.generatedBy?.name),
    createInfoRow('Created on', formatDate(data.generatedAt)),
    new Paragraph({ text: '', spacing: { after: 200 } })
  ];
}

/**
 * Build Scope section
 */
function buildScopeSection(data) {
  const sections = [
    createHeading('Scope', HeadingLevel.HEADING_2),
    createParagraph(
      `This report covers ${data.systems?.length || 0} system(s) from ${formatDate(data.period?.startDate)} to ${formatDate(data.period?.endDate)}.`
    )
  ];

  if (data.systems?.length > 0) {
    data.systems.forEach(system => {
      sections.push(createParagraph(
        `• ${system.name}${system.systemType ? ` (${system.systemType.name})` : ''}`
      ));
    });
  }

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  return sections;
}

/**
 * Build Systems section
 * @param {Object} data - Report data
 * @param {boolean} includePhotos - Whether to include photos
 * @param {Map<number, Buffer>} systemPhotoBuffers - Pre-fetched photo buffers
 */
function buildSystemsSection(data, includePhotos, systemPhotoBuffers = new Map()) {
  const sections = [
    createHeading('Systems', HeadingLevel.HEADING_2)
  ];

  if (!data.systems || data.systems.length === 0) {
    sections.push(createParagraph('No systems in this report.'));
    return sections;
  }

  // Systems table
  const headers = ['Name', 'Type', 'Status', 'Description'];
  const rows = data.systems.map(system => [
    system.name || '-',
    system.systemType?.name || '-',
    system.status || '-',
    system.description || '-'
  ]);

  sections.push(createTable(headers, rows));

  // Process Stages (children)
  const systemsWithChildren = data.systems.filter(s => s.children && s.children.length > 0);
  if (systemsWithChildren.length > 0) {
    sections.push(createHeading('Process Stages', HeadingLevel.HEADING_3));
    systemsWithChildren.forEach(system => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: `${system.name}:`, bold: true })],
        spacing: { before: 150, after: 80 }
      }));
      system.children.forEach(stage => {
        sections.push(createParagraph(`  • ${stage.name}`));
      });
    });
  }

  // System Photos
  if (includePhotos && systemPhotoBuffers.size > 0) {
    sections.push(createHeading('System Photos', HeadingLevel.HEADING_3));

    data.systems.forEach(system => {
      if (system.photos && system.photos.length > 0) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `${system.name}:`, bold: true })],
          spacing: { before: 200, after: 100 }
        }));

        system.photos.forEach(photo => {
          const photoBuffer = systemPhotoBuffers.get(photo.id);
          if (photoBuffer) {
            sections.push(new Paragraph({
              children: [
                new ImageRun({
                  data: photoBuffer,
                  transformation: {
                    width: 400,
                    height: 300
                  }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 }
            }));

            // Photo caption
            if (photo.caption || photo.description) {
              sections.push(new Paragraph({
                children: [new TextRun({ text: photo.caption || photo.description, italics: true, color: '666666', size: 18 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 150 }
              }));
            }
          }
        });
      }
    });
  }

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  return sections;
}

/**
 * Build Analyses section
 * @param {Object} data - Report data
 * @param {Object} block - Block configuration
 * @param {Object} chartBuffers - Pre-generated chart buffers { field: Buffer[], laboratory: Buffer[] }
 */
function buildAnalysesSection(data, block, chartBuffers = { field: [], laboratory: [] }) {
  const sections = [];
  const fieldLogs = data.dailyLogs?.filter(log => log.recordType === 'field') || [];
  const laboratoryLogs = data.dailyLogs?.filter(log => log.recordType === 'laboratory') || [];

  const showFieldOverview = block.showFieldOverview !== false;
  const showFieldDetailed = block.showFieldDetailed === true;
  const showLaboratoryOverview = block.showLaboratoryOverview !== false;
  const showLaboratoryDetailed = block.showLaboratoryDetailed === true;
  const includeCharts = block.includeCharts === true;

  // Field Overview
  if (showFieldOverview) {
    sections.push(createHeading('Field Monitoring Analysis – Overview', HeadingLevel.HEADING_2));
    if (fieldLogs.length === 0) {
      sections.push(createParagraph('No field monitoring data available.'));
    } else {
      const headers = ['Date', 'System', 'User', 'Entries'];
      if (block.highlightAlerts) headers.push('Alerts');

      const rows = fieldLogs.map(log => {
        const outOfRange = log.entries?.filter(e => e.isOutOfRange).length || 0;
        const row = [
          formatDate(log.date),
          log.system?.name || log.stage?.name || '-',
          log.user?.name || '-',
          log.entries?.length || 0
        ];
        if (block.highlightAlerts) row.push(outOfRange);
        return row;
      });
      sections.push(createTable(headers, rows));
    }
  }

  // Field Charts
  if (includeCharts && chartBuffers.field && chartBuffers.field.length > 0) {
    sections.push(createHeading('Field Monitoring Charts', HeadingLevel.HEADING_3));
    chartBuffers.field.forEach(chartBuffer => {
      sections.push(new Paragraph({
        children: [
          new ImageRun({
            data: chartBuffer,
            transformation: {
              width: 500,
              height: 250
            }
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 150, after: 200 }
      }));
    });
  }

  // Field Detailed
  if (showFieldDetailed && fieldLogs.length > 0) {
    sections.push(createHeading('Field Monitoring Analysis – Detailed', HeadingLevel.HEADING_2));
    sections.push(...buildDetailedAnalysisTable(fieldLogs));
  }

  // Laboratory Overview
  if (showLaboratoryOverview) {
    sections.push(createHeading('Laboratory Monitoring Analysis – Overview', HeadingLevel.HEADING_2));
    if (laboratoryLogs.length === 0) {
      sections.push(createParagraph('No laboratory monitoring data available.'));
    } else {
      const headers = ['Date', 'System', 'User', 'Entries'];
      if (block.highlightAlerts) headers.push('Alerts');

      const rows = laboratoryLogs.map(log => {
        const outOfRange = log.entries?.filter(e => e.isOutOfRange).length || 0;
        const row = [
          formatDate(log.date),
          log.system?.name || log.stage?.name || '-',
          log.user?.name || '-',
          log.entries?.length || 0
        ];
        if (block.highlightAlerts) row.push(outOfRange);
        return row;
      });
      sections.push(createTable(headers, rows));
    }
  }

  // Laboratory Charts
  if (includeCharts && chartBuffers.laboratory && chartBuffers.laboratory.length > 0) {
    sections.push(createHeading('Laboratory Monitoring Charts', HeadingLevel.HEADING_3));
    chartBuffers.laboratory.forEach(chartBuffer => {
      sections.push(new Paragraph({
        children: [
          new ImageRun({
            data: chartBuffer,
            transformation: {
              width: 500,
              height: 250
            }
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 150, after: 200 }
      }));
    });
  }

  // Laboratory Detailed
  if (showLaboratoryDetailed && laboratoryLogs.length > 0) {
    sections.push(createHeading('Laboratory Monitoring Analysis – Detailed', HeadingLevel.HEADING_2));
    sections.push(...buildDetailedAnalysisTable(laboratoryLogs));
  }

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  return sections;
}

/**
 * Build detailed analysis table for daily logs
 */
function buildDetailedAnalysisTable(logs) {
  const sections = [];
  const MAX_DAYS = 7;

  // Get unique dates (last 7 days)
  const allDates = [...new Set(logs.map(log => log.date))].sort();
  const uniqueDates = allDates.slice(-MAX_DAYS);

  if (uniqueDates.length === 0) {
    sections.push(createParagraph('No detailed analysis data available.'));
    return sections;
  }

  // Build monitoring point map
  const monitoringPointMap = new Map();
  const valueMap = new Map();
  const dateSet = new Set(uniqueDates);

  logs.filter(log => dateSet.has(log.date)).forEach(log => {
    log.entries?.forEach(entry => {
      if (entry.monitoringPoint) {
        const mp = entry.monitoringPoint;
        if (!monitoringPointMap.has(mp.id)) {
          monitoringPointMap.set(mp.id, {
            id: mp.id,
            name: mp.name,
            minValue: mp.minValue,
            maxValue: mp.maxValue,
            unit: mp.unit?.symbol
          });
        }
        const key = `${log.date}_${mp.id}`;
        valueMap.set(key, {
          value: entry.value,
          isOutOfRange: entry.isOutOfRange
        });
      }
    });
  });

  const monitoringPoints = Array.from(monitoringPointMap.values());

  if (monitoringPoints.length === 0) {
    sections.push(createParagraph('No detailed analysis data available.'));
    return sections;
  }

  // Build headers
  const headers = ['Parameter', 'Range', ...uniqueDates.map(d => formatShortDate(d))];

  // Build rows
  const rows = monitoringPoints.map(mp => {
    const row = [
      `${mp.name}${mp.unit ? ` (${mp.unit})` : ''}`,
      formatRange(mp.minValue, mp.maxValue)
    ];
    uniqueDates.forEach(date => {
      const key = `${date}_${mp.id}`;
      const entry = valueMap.get(key);
      row.push(entry?.value !== undefined && entry?.value !== null ? Number(entry.value).toFixed(2) : '-');
    });
    return row;
  });

  sections.push(createTable(headers, rows));
  return sections;
}

/**
 * Format short date (DD/MM)
 */
function formatShortDate(dateString) {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return dateString;
  }
}

/**
 * Format range (min - max)
 */
function formatRange(min, max) {
  if (min === undefined && max === undefined) return '-';
  const minStr = min !== undefined ? Number(min).toFixed(2) : '∞';
  const maxStr = max !== undefined ? Number(max).toFixed(2) : '∞';
  return `${minStr} – ${maxStr}`;
}

/**
 * Build Inspections section
 */
function buildInspectionsSection(data, block) {
  const sections = [
    createHeading('Inspections', HeadingLevel.HEADING_2)
  ];

  if (!data.inspections || data.inspections.length === 0) {
    sections.push(createParagraph('No inspections in this report.'));
    return sections;
  }

  const showOverview = block.showInspectionOverview !== false;
  const showDetailed = block.showInspectionDetailed === true;
  const highlightOnlyNC = block.highlightOnlyNonConformities !== false;

  // Filter inspections if needed
  const displayInspections = highlightOnlyNC
    ? data.inspections.filter(i => i.items?.some(item => item.status === 'NC'))
    : data.inspections;

  if (displayInspections.length === 0) {
    sections.push(createParagraph(
      highlightOnlyNC ? 'No inspections with non-conformities found.' : 'No inspections in this report.'
    ));
    return sections;
  }

  // Overview
  if (showOverview) {
    sections.push(createHeading('Inspections – Overview', HeadingLevel.HEADING_3));

    const headers = ['Date', 'System', 'Inspector', 'Status', 'Compliant', 'NC'];
    const rows = displayInspections.map(insp => {
      const c = insp.items?.filter(i => i.status === 'C').length || 0;
      const nc = insp.items?.filter(i => i.status === 'NC').length || 0;
      return [
        formatDate(insp.date),
        insp.system?.name || '-',
        insp.user?.name || '-',
        insp.status || '-',
        c,
        nc
      ];
    });
    sections.push(createTable(headers, rows));
  }

  // Detailed
  if (showDetailed) {
    sections.push(createHeading('Inspections – Detailed View', HeadingLevel.HEADING_3));

    displayInspections.forEach(insp => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: `Inspection: ${formatDate(insp.date)} - ${insp.system?.name || 'N/A'}`, bold: true })],
        spacing: { before: 200, after: 100 }
      }));

      sections.push(createInfoRow('Inspector', insp.user?.name));
      sections.push(createInfoRow('Status', insp.status));

      if (insp.items && insp.items.length > 0) {
        const itemHeaders = ['Item', 'Status', 'Comment'];
        const itemRows = insp.items.map(item => [
          item.checklistItem?.name || '-',
          item.status || '-',
          item.comment || item.notes || '-'
        ]);
        sections.push(createTable(itemHeaders, itemRows));
      }

      if (insp.conclusion) {
        sections.push(createParagraph(`Conclusion: ${insp.conclusion}`));
      }
    });
  }

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  return sections;
}

/**
 * Build Occurrences section
 */
function buildOccurrencesSection(data, block) {
  const sections = [
    createHeading('Occurrences', HeadingLevel.HEADING_2)
  ];

  if (!data.incidents || data.incidents.length === 0) {
    sections.push(createParagraph('No occurrences in this report.'));
    return sections;
  }

  const showOverview = block.showOccurrenceOverview !== false;
  const showDetailed = block.showOccurrenceDetailed === true;
  const showOnlyHighestCriticality = block.showOnlyHighestCriticality !== false;
  const criticalityFilter = block.criticalityFilter || 'all';

  // Filter incidents
  let filteredIncidents = [...data.incidents];

  if (criticalityFilter && criticalityFilter !== 'all') {
    filteredIncidents = filteredIncidents.filter(i => i.priority === criticalityFilter);
  } else if (showOnlyHighestCriticality) {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    let highest = 'low';
    let highestOrder = 0;
    filteredIncidents.forEach(inc => {
      const order = priorityOrder[inc.priority] || 0;
      if (order > highestOrder) {
        highestOrder = order;
        highest = inc.priority;
      }
    });
    filteredIncidents = filteredIncidents.filter(i => i.priority === highest);
  }

  if (filteredIncidents.length === 0) {
    sections.push(createParagraph('No occurrences matching the filter criteria.'));
    return sections;
  }

  // Overview
  if (showOverview) {
    sections.push(createHeading('Occurrences – Overview', HeadingLevel.HEADING_3));
    sections.push(createParagraph(`Showing ${filteredIncidents.length} of ${data.incidents.length} occurrences.`));

    const headers = ['Title', 'System', 'Priority', 'Status', 'Date'];
    const rows = filteredIncidents.map(inc => [
      inc.title || '-',
      inc.system?.name || '-',
      inc.priority || '-',
      inc.status || '-',
      formatDate(inc.createdAt)
    ]);
    sections.push(createTable(headers, rows));
  }

  // Timeline
  if (block.includeTimeline && filteredIncidents.length > 0) {
    sections.push(createHeading('Timeline', HeadingLevel.HEADING_3));
    filteredIncidents.slice(0, 5).forEach(inc => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `${formatDateTime(inc.createdAt)} - `, italics: true, color: '666666' }),
          new TextRun({ text: inc.title })
        ],
        spacing: { after: 80 }
      }));
      if (inc.resolvedAt) {
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: `  Resolved: ${formatDateTime(inc.resolvedAt)}`, color: '16A34A' })
          ],
          spacing: { after: 80 }
        }));
      }
    });
  }

  // Detailed
  if (showDetailed) {
    sections.push(createHeading('Occurrences – Detailed View', HeadingLevel.HEADING_3));

    filteredIncidents.forEach(inc => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: inc.title, bold: true })],
        spacing: { before: 200, after: 100 }
      }));

      sections.push(createInfoRow('System', inc.system?.name));
      sections.push(createInfoRow('Priority', inc.priority));
      sections.push(createInfoRow('Status', inc.status));
      sections.push(createInfoRow('Created', formatDateTime(inc.createdAt)));
      if (inc.reporter) sections.push(createInfoRow('Reporter', inc.reporter.name));
      if (inc.assignee) sections.push(createInfoRow('Assigned to', inc.assignee.name));
      if (inc.resolvedAt) sections.push(createInfoRow('Resolved', formatDateTime(inc.resolvedAt)));
      if (inc.description) {
        sections.push(createParagraph(`Description: ${inc.description}`));
      }

      // Comments
      if (block.includeComments && inc.comments && inc.comments.length > 0) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Comments (${inc.comments.length}):`, bold: true })],
          spacing: { before: 100, after: 80 }
        }));
        inc.comments.forEach(comment => {
          sections.push(createParagraph(
            `  ${comment.user?.name || 'Unknown'} (${formatDateTime(comment.createdAt)}): ${comment.content}`
          ));
        });
      }
    });
  }

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  return sections;
}

/**
 * Build Conclusion section
 */
function buildConclusionSection(data) {
  const sections = [
    createHeading('Conclusion', HeadingLevel.HEADING_2)
  ];

  // Summary statistics
  sections.push(createHeading('Report Summary', HeadingLevel.HEADING_3));

  const summary = data.summary || {};
  sections.push(createInfoRow('Total Systems', String(summary.totalSystems || 0)));
  sections.push(createInfoRow('Total Analyses', String(summary.totalReadings || 0)));
  sections.push(createInfoRow('Total Inspections', String(summary.totalInspections || 0)));
  sections.push(createInfoRow('Total Occurrences', String(summary.totalIncidents || 0)));

  // Alerts
  if (summary.outOfRangeCount > 0) {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: '⚠ Alerts Found: ', bold: true, color: 'DC2626' }),
        new TextRun({ text: `${summary.outOfRangeCount} out of range readings`, color: 'DC2626' })
      ],
      spacing: { before: 150, after: 80 }
    }));
  }

  if (summary.openIncidents > 0) {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: '⚡ Open Incidents: ', bold: true, color: 'F59E0B' }),
        new TextRun({ text: String(summary.openIncidents), color: 'F59E0B' })
      ],
      spacing: { after: 80 }
    }));
  }

  // Conclusion text
  if (data.conclusion) {
    sections.push(createHeading('Conclusion Text', HeadingLevel.HEADING_3));
    sections.push(new Paragraph({
      children: [new TextRun({ text: data.conclusion })],
      spacing: { after: 200 }
    }));
  } else {
    sections.push(new Paragraph({
      children: [new TextRun({ text: 'No conclusion provided for this report.', italics: true, color: '666666' })],
      spacing: { after: 200 }
    }));
  }

  return sections;
}

/**
 * Build Signature section
 */
function buildSignatureSection(data) {
  const sections = [];

  sections.push(new Paragraph({ text: '', spacing: { after: 400 } }));

  sections.push(new Paragraph({
    children: [new TextRun({ text: '________________________________' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }));

  sections.push(new Paragraph({
    children: [new TextRun({ text: data.signature?.name || data.generatedBy?.name || '', bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 }
  }));

  if (data.signature?.role) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: data.signature.role, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }));
  }

  if (data.signature?.registration) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: data.signature.registration, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }));
  }

  sections.push(new Paragraph({
    children: [new TextRun({ text: formatDate(data.generatedAt), color: '666666' })],
    alignment: AlignmentType.CENTER
  }));

  return sections;
}

/**
 * Main function to generate Word document
 * @param {object} reportData - The report data
 * @param {object} config - The template configuration
 * @param {string} reportName - The report name
 * @param {string|null} templateLogo - Optional template logo URL (overrides client logo)
 * @param {object|null} chartData - Chart data for generating chart images { fieldCharts, laboratoryCharts, fieldChartConfig, laboratoryChartConfig }
 */
async function generateWordDocument(reportData, config, reportName, templateLogo = null, chartData = null) {
  const { blocks = [], branding = {} } = config || {};
  const isServiceProvider = reportData.isServiceProvider || false;

  // Determine which logo to use: template logo > client logo
  const logoUrl = templateLogo || reportData.client?.logo || null;

  // Sort enabled blocks by order
  const enabledBlocks = blocks
    .filter(block => block.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Pre-fetch system photos if needed
  const systemsBlock = enabledBlocks.find(b => b.type === 'systems');
  const systemPhotoBuffers = new Map();

  if (systemsBlock?.includePhotos && reportData.systems) {
    const photoPromises = [];
    reportData.systems.forEach(system => {
      if (system.photos && system.photos.length > 0) {
        system.photos.forEach(photo => {
          if (photo.url) {
            photoPromises.push(
              fetchImageBuffer(photo.url)
                .then(buffer => ({ id: photo.id, buffer }))
                .catch(err => {
                  console.warn(`Failed to fetch system photo ${photo.id}:`, err.message);
                  return null;
                })
            );
          }
        });
      }
    });

    const photoResults = await Promise.all(photoPromises);
    photoResults.forEach(result => {
      if (result) {
        systemPhotoBuffers.set(result.id, result.buffer);
      }
    });
  }

  // Generate chart images if needed
  const analysesBlock = enabledBlocks.find(b => b.type === 'analyses');
  const chartBuffers = { field: [], laboratory: [] };

  if (analysesBlock?.includeCharts && chartData) {
    const fieldChartConfig = chartData.fieldChartConfig || {};
    const labChartConfig = chartData.laboratoryChartConfig || {};

    // Generate field chart images
    if (chartData.fieldCharts && chartData.fieldCharts.length > 0) {
      for (const chartSeries of chartData.fieldCharts) {
        if (chartSeries.data && chartSeries.data.length > 0) {
          try {
            const chartBuffer = await generateChartImage(chartSeries, fieldChartConfig);
            chartBuffers.field.push(chartBuffer);
          } catch (err) {
            console.warn(`Failed to generate field chart for ${chartSeries.monitoringPointName}:`, err.message);
          }
        }
      }
    }

    // Generate laboratory chart images
    if (chartData.laboratoryCharts && chartData.laboratoryCharts.length > 0) {
      for (const chartSeries of chartData.laboratoryCharts) {
        if (chartSeries.data && chartSeries.data.length > 0) {
          try {
            const chartBuffer = await generateChartImage(chartSeries, labChartConfig);
            chartBuffers.laboratory.push(chartBuffer);
          } catch (err) {
            console.warn(`Failed to generate laboratory chart for ${chartSeries.monitoringPointName}:`, err.message);
          }
        }
      }
    }
  }

  // Build document sections
  const children = [];

  for (const block of enabledBlocks) {
    switch (block.type) {
      case 'identification':
        children.push(...buildIdentificationSection(reportData, reportName, isServiceProvider));
        break;
      case 'scope':
        children.push(...buildScopeSection(reportData));
        break;
      case 'systems':
        children.push(...buildSystemsSection(reportData, block.includePhotos, systemPhotoBuffers));
        break;
      case 'analyses':
        children.push(...buildAnalysesSection(reportData, block, chartBuffers));
        break;
      case 'inspections':
        children.push(...buildInspectionsSection(reportData, block));
        break;
      case 'occurrences':
        children.push(...buildOccurrencesSection(reportData, block));
        break;
      case 'conclusion':
        children.push(...buildConclusionSection(reportData));
        break;
      case 'signature':
        children.push(...buildSignatureSection(reportData));
        break;
      case 'attachments':
        children.push(createHeading('Attachments', HeadingLevel.HEADING_2));
        children.push(createParagraph('Additional documents and files can be attached here.'));
        break;
    }
  }

  // Try to fetch logo if showLogo is enabled and we have a logo URL
  let logoBuffer = null;
  if (branding.showLogo && logoUrl) {
    try {
      logoBuffer = await fetchImageBuffer(logoUrl);
    } catch (err) {
      console.warn('Failed to fetch logo for Word document:', err.message);
    }
  }

  // Build header content based on logo position
  const buildHeaderChildren = () => {
    const headerChildren = [];
    const logoPosition = branding.logoPosition || 'left';

    if (logoBuffer && branding.showLogo) {
      // Match PDF styling: width 80, height 40 (same aspect ratio as PDF headerLogo)
      const logoRun = new ImageRun({
        data: logoBuffer,
        transformation: {
          width: 80,
          height: 40
        }
      });

      // Determine alignment based on logo position
      let alignment = AlignmentType.LEFT;
      if (logoPosition === 'center') alignment = AlignmentType.CENTER;
      else if (logoPosition === 'right') alignment = AlignmentType.RIGHT;

      // If header text is enabled, create two-column layout
      if (branding.showHeader && branding.headerText) {
        // Logo paragraph
        headerChildren.push(new Paragraph({
          children: [logoRun],
          alignment
        }));
        // Header text paragraph
        headerChildren.push(new Paragraph({
          children: [new TextRun({ text: branding.headerText, size: 18, color: '666666' })],
          alignment: logoPosition === 'left' ? AlignmentType.RIGHT : AlignmentType.LEFT
        }));
      } else {
        // Just logo
        headerChildren.push(new Paragraph({
          children: [logoRun],
          alignment
        }));
      }
    } else if (branding.showHeader && branding.headerText) {
      // Just header text
      headerChildren.push(new Paragraph({
        children: [new TextRun({ text: branding.headerText, size: 18, color: '666666' })],
        alignment: AlignmentType.RIGHT
      }));
    }

    return headerChildren;
  };

  const headerChildren = buildHeaderChildren();
  const hasHeader = headerChildren.length > 0;

  // Create the document
  const doc = new Document({
    title: reportName,
    creator: reportData.generatedBy?.name || 'LINCE System',
    description: `Report generated on ${formatDate(reportData.generatedAt)}`,
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(0.75)
          }
        }
      },
      headers: hasHeader ? {
        default: new Header({
          children: headerChildren
        })
      } : undefined,
      footers: branding.showFooter ? {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Page ', size: 18, color: '666666' }),
              new TextRun({
                children: [PageNumber.CURRENT],
                size: 18,
                color: '666666'
              }),
              new TextRun({ text: ' of ', size: 18, color: '666666' }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                size: 18,
                color: '666666'
              })
            ],
            alignment: AlignmentType.CENTER
          })]
        })
      } : undefined,
      children
    }]
  });

  // Generate the document buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = {
  generateWordDocument
};
