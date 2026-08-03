import { format } from "date-fns";
import { useState } from "react";

import { dailyReport } from "@/domain/services/report.service";
import { BreakdownList } from "@/features/reports/components/breakdown-list";
import { ExportButton } from "@/features/reports/components/export-button";
import { SummaryCards } from "@/features/reports/components/summary-cards";
import { exportDailyReport } from "@/features/reports/export-report";
import { reportExportLabels } from "@/features/reports/report-labels";
import { expenseCategoryLabel } from "@/features/expenses/expense-presenter";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app.store";

export function DailyReportPanel() {
  const business = useAppStore((state) => state.business);
  const payments = useAppStore((state) => state.payments);
  const expenses = useAppStore((state) => state.expenses);
  const appointments = useAppStore((state) => state.appointments);
  const currency = business?.currency ?? "GTQ";
  const timeZone = business?.timezone ?? "America/Guatemala";
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const report = dailyReport(date, {
    payments,
    expenses,
    appointments,
    timeZone,
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="field-group max-w-56">
          <Label htmlFor="report-date">Día</Label>
          <Input
            id="report-date"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>
        <ExportButton
          onExport={() => exportDailyReport(date, report, reportExportLabels)}
        />
      </div>
      <SummaryCards currency={currency} summary={report} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <BreakdownList
          currency={currency}
          emptyText="Sin ingresos este día."
          items={report.incomeByMethod.map((item) => ({
            label: paymentMethodLabel[item.method],
            total: item.total,
          }))}
          title="Ingresos por método"
        />
        <BreakdownList
          currency={currency}
          emptyText="Sin egresos este día."
          items={report.expenseByCategory.map((item) => ({
            label: expenseCategoryLabel[item.category],
            total: item.total,
          }))}
          title="Egresos por categoría"
        />
      </div>
    </div>
  );
}
