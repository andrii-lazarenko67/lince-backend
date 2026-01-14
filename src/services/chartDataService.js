'use strict';

const { DailyLog, DailyLogEntry, MonitoringPoint, Parameter, Unit } = require('../../db/models');
const { Op } = require('sequelize');

/**
 * Aggregates values based on the specified period
 * @param {Array} entries - Array of { date, value, isOutOfRange } objects
 * @param {string} aggregation - 'daily' | 'weekly' | 'monthly'
 * @returns {Array} Aggregated data points
 */
function aggregateData(entries, aggregation) {
  if (!entries || entries.length === 0) return [];

  const grouped = new Map();

  entries.forEach(entry => {
    const date = new Date(entry.date);
    let key;
    let label;

    switch (aggregation) {
      case 'weekly': {
        // Get ISO week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        label = `Sem ${weekNumber}`;
        break;
      }
      case 'monthly': {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        label = `${months[date.getMonth()]}-${date.getFullYear().toString().slice(-2)}`;
        break;
      }
      default: // daily
        key = entry.date;
        label = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: entry.date,
        label,
        values: [],
        outOfRangeCount: 0
      });
    }

    const group = grouped.get(key);
    if (entry.value !== null && entry.value !== undefined) {
      group.values.push(parseFloat(entry.value));
    }
    if (entry.isOutOfRange) {
      group.outOfRangeCount++;
    }
  });

  // Calculate average for each group
  return Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(group => ({
      date: group.date,
      label: group.label,
      value: group.values.length > 0
        ? group.values.reduce((a, b) => a + b, 0) / group.values.length
        : null,
      isOutOfRange: group.outOfRangeCount > 0
    }));
}

/**
 * Prepares chart data from daily logs
 * @param {Object} options - Query options
 * @param {number} options.clientId - Client ID
 * @param {Array<number>} options.systemIds - System IDs to filter
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {Array<number>} options.monitoringPointIds - Optional specific monitoring points
 * @param {string} options.aggregation - 'daily' | 'weekly' | 'monthly'
 * @param {string} options.recordType - 'field' | 'laboratory' | null (both)
 * @returns {Promise<Array<ChartSeriesData>>}
 */
async function prepareChartData(options) {
  const {
    clientId,
    systemIds = [],
    startDate,
    endDate,
    monitoringPointIds = [],
    aggregation = 'daily',
    recordType = null
  } = options;

  // Build where clause for DailyLogs
  const logWhere = {
    clientId,
    date: { [Op.between]: [startDate, endDate] }
  };

  if (systemIds.length > 0) {
    logWhere.systemId = { [Op.in]: systemIds };
  }

  if (recordType) {
    logWhere.recordType = recordType;
  }

  // Build where clause for MonitoringPoints
  const mpWhere = {};
  if (monitoringPointIds.length > 0) {
    mpWhere.id = { [Op.in]: monitoringPointIds };
  }

  // Fetch all daily logs with entries
  const dailyLogs = await DailyLog.findAll({
    where: logWhere,
    include: [{
      model: DailyLogEntry,
      as: 'entries',
      include: [{
        model: MonitoringPoint,
        as: 'monitoringPoint',
        where: Object.keys(mpWhere).length > 0 ? mpWhere : undefined,
        required: true,
        include: [
          { model: Parameter, as: 'parameterObj', attributes: ['id', 'name'] },
          { model: Unit, as: 'unitObj', attributes: ['id', 'abbreviation'] }
        ]
      }]
    }],
    order: [['date', 'ASC']]
  });

  // Group entries by monitoring point
  const monitoringPointData = new Map();

  dailyLogs.forEach(log => {
    log.entries?.forEach(entry => {
      const mp = entry.monitoringPoint;
      if (!mp) return;

      if (!monitoringPointData.has(mp.id)) {
        monitoringPointData.set(mp.id, {
          monitoringPointId: mp.id,
          monitoringPointName: mp.name,
          parameterName: mp.parameterObj?.name || mp.name,
          unit: mp.unitObj?.abbreviation || '',
          minValue: mp.minValue !== null ? parseFloat(mp.minValue) : null,
          maxValue: mp.maxValue !== null ? parseFloat(mp.maxValue) : null,
          entries: []
        });
      }

      monitoringPointData.get(mp.id).entries.push({
        date: log.date,
        value: entry.value,
        isOutOfRange: entry.isOutOfRange
      });
    });
  });

  // Aggregate and format data for each monitoring point
  const chartSeries = [];

  monitoringPointData.forEach((mpData) => {
    const aggregatedData = aggregateData(mpData.entries, aggregation);

    chartSeries.push({
      monitoringPointId: mpData.monitoringPointId,
      monitoringPointName: mpData.monitoringPointName,
      parameterName: mpData.parameterName,
      unit: mpData.unit,
      minValue: mpData.minValue,
      maxValue: mpData.maxValue,
      data: aggregatedData,
      color: null // Will be set by frontend based on chartConfig
    });
  });

  return chartSeries;
}

module.exports = {
  prepareChartData,
  aggregateData
};
