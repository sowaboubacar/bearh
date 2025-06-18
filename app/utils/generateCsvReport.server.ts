/* eslint-disable @typescript-eslint/no-explicit-any */
import { stringify } from 'csv-stringify/sync';

export async function generateCsvReport(options: any) {
  const { reportsData } = options;
  const headers = ['Période', 'Heures Travaillées', 'Tâches Complétées', 'Score KPI Moyen', 'Observations Positives', 'Observations Négatives', 'Congés Totaux'];
  const rows = [headers];

  Object.entries(reportsData).forEach(([key, report]: [string, any]) => {
    const [year, month] = key.split('-');
    rows.push([
      `${month}/${year}`,
      report.attendanceData.totalHours.toFixed(2),
      report.taskData.completed,
      report.performanceData.meanScore.toFixed(2),
      report.observationData.positive,
      report.observationData.negative,
      report.leaveData.totalLeaves
    ]);
  });

  const csvContent = stringify(rows, { delimiter: ',' });
  return csvContent;
}

