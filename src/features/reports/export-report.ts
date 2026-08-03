import type {
  FinanceSummary,
  MonthlyReport,
} from "@/domain/services/report.service";
import {
  dailyReportRows,
  monthlyReportRows,
  type ReportLabels,
} from "@/features/reports/report-export";
import { buildWorkbookBytes } from "@/infrastructure/export/excel-workbook";
import { saveXlsx } from "@/infrastructure/export/save-file";

export async function exportDailyReport(
  date: string,
  report: FinanceSummary,
  labels: ReportLabels,
): Promise<boolean> {
  const rows = dailyReportRows(date, report, labels);
  const bytes = await buildWorkbookBytes("Reporte diario", rows);
  return saveXlsx(`reporte-diario-${date}.xlsx`, bytes);
}

export async function exportMonthlyReport(
  month: string,
  report: MonthlyReport,
  labels: ReportLabels,
): Promise<boolean> {
  const rows = monthlyReportRows(month, report, labels);
  const bytes = await buildWorkbookBytes("Reporte mensual", rows);
  return saveXlsx(`reporte-mensual-${month}.xlsx`, bytes);
}
