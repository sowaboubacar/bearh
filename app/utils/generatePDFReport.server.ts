/* eslint-disable @typescript-eslint/no-explicit-any */
// app/utils/generatePdfReport.ts

import PDFDocument from "pdfkit";

interface GeneratePdfReportOptions {
  year?: number;
  month?: number;
  months?: { year: number; month: number }[];
  user: { firstName: string; lastName: string };
  reportsData: any; // This would be the aggregated data from userMonthlyReportService
  comparisonMode?: boolean; // if multiple months selected
}

/**
 * Generate a PDF buffer containing the global report.
 * If single month is selected: show that month's data.
 * If multiple months: show comparison data.
 */
export async function generatePdfReport(options: GeneratePdfReportOptions) {
  const { user, reportsData, year, month, months, comparisonMode } = options;

  const doc = new PDFDocument({ size: "A4", layout: "portrait" });
  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {});

  // Title
  doc.fontSize(20).text("Rapport Global", { align: "center", underline: true });
  if (!comparisonMode && year && month) {
    doc
      .fontSize(12)
      .text(`Utilisateur: ${user.firstName} ${user.lastName}`, {
        align: "center",
      });
    doc.text(`Période: ${month}/${year}`, { align: "center" });
  } else if (comparisonMode && months) {
    doc
      .fontSize(12)
      .text(`Utilisateur: ${user.firstName} ${user.lastName}`, {
        align: "center",
      });
    const periodStr = months.map((m) => `${m.month}/${m.year}`).join(", ");
    doc.text(`Comparaison des mois: ${periodStr}`, { align: "center" });
  }

  doc.moveDown();

  // Add a summary of metrics
  doc.fontSize(14).text("Résumé des métriques:", { underline: true });
  doc.moveDown(0.5);

  if (!comparisonMode) {
    // Single month
    const {
      attendanceData,
      taskData,
      performanceData,
      leaveData,
      observationData,
    } = reportsData; // This is a single month's data

    doc.fontSize(12);
    doc.text(
      `Attenance: Heures totales: ${attendanceData.totalHours}, Moyenne: ${attendanceData.meanHours}, Absences: ${attendanceData.absences}, Retards: ${attendanceData.lates}`
    );
    doc.text(
      `Tâches: Total: ${taskData.totalTasks}, Complétées: ${
        taskData.completed
      }, En cours: ${taskData.inProgress}, Ratio Complétées: ${Math.round(
        taskData.ratioCompleted * 100
      )}%`
    );
    doc.text(`Performance (KPI): Moyenne: ${performanceData.meanScore}`);
    doc.text(
      `Observations: Positives: ${observationData.positive}, Négatives: ${
        observationData.negative
      }, Ratio positives: ${Math.round(observationData.ratioPositive * 100)}%`
    );
    doc.text(
      `Congés: Total: ${leaveData.totalLeaves}, Ratio: ${Math.round(
        leaveData.ratioLeaves * 100
      )}%, Par type: ${JSON.stringify(leaveData.leavesByType)}`
    );
  } else {
    // Comparison mode - multiple months
    // reportsData would be something like { [year-month]: {attendanceData, ...}, ... }

    doc
      .fontSize(12)
      .text("Comparaison entre mois (Vous pouvez détailler ici chaque mois)");
    for (const key of Object.keys(reportsData)) {
      // key might be "YYYY-MM"
      const data = reportsData[key];
      doc.moveDown(0.5).text(`Mois ${key}: `, { underline: true });
      doc.text(`Attenance: ${JSON.stringify(data.attendanceData)}`);
      doc.text(`Tâches: ${JSON.stringify(data.taskData)}`);
      doc.text(`KPI: ${JSON.stringify(data.performanceData)}`);
      doc.text(`Observations: ${JSON.stringify(data.observationData)}`);
      doc.text(`Congés: ${JSON.stringify(data.leaveData)}`);
    }
  }

  // Footer
  doc.moveDown(2);
  doc
    .fontSize(10)
    .text("© 2024 VotreEntreprise. Tous droits réservés.", { align: "center" });

  doc.end();
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });
  return pdfBuffer;
}
