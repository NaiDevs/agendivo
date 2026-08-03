import { format } from "date-fns";
import { useState } from "react";

import { monthlyReport } from "@/domain/services/report.service";
import { BreakdownList } from "@/features/reports/components/breakdown-list";
import { SummaryCards } from "@/features/reports/components/summary-cards";
import { expenseCategoryLabel } from "@/features/expenses/expense-presenter";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app.store";

export function MonthlyReportPanel() {
  const business = useAppStore((state) => state.business);
  const payments = useAppStore((state) => state.payments);
  const expenses = useAppStore((state) => state.expenses);
  const appointments = useAppStore((state) => state.appointments);
  const currency = business?.currency ?? "GTQ";
  const timeZone = business?.timezone ?? "America/Guatemala";
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const report = monthlyReport(month, {
    payments,
    expenses,
    appointments,
    timeZone,
  });

  return (
    <div className="grid gap-6">
      <div className="field-group max-w-56">
        <Label htmlFor="report-month">Mes</Label>
        <Input
          id="report-month"
          onChange={(event) => setMonth(event.target.value)}
          type="month"
          value={month}
        />
      </div>
      <SummaryCards currency={currency} summary={report} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <BreakdownList
          currency={currency}
          emptyText="Sin ingresos este mes."
          items={report.incomeByMethod.map((item) => ({
            label: paymentMethodLabel[item.method],
            total: item.total,
          }))}
          title="Ingresos por método"
        />
        <BreakdownList
          currency={currency}
          emptyText="Sin egresos este mes."
          items={report.expenseByCategory.map((item) => ({
            label: expenseCategoryLabel[item.category],
            total: item.total,
          }))}
          title="Egresos por categoría"
        />
      </div>
      <div className="surface-card p-5">
        <h2 className="mb-4 font-semibold">Detalle diario</h2>
        {report.days.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin movimientos este mes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="pb-2 font-medium">Día</th>
                  <th className="pb-2 text-right font-medium">Ingresos</th>
                  <th className="pb-2 text-right font-medium">Egresos</th>
                  <th className="pb-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.days.map((day) => (
                  <tr className="border-b last:border-0" key={day.date}>
                    <td className="py-2">
                      {format(new Date(`${day.date}T00:00:00`), "dd/MM")}
                    </td>
                    <td className="py-2 text-right">
                      {formatMoney(day.income, currency)}
                    </td>
                    <td className="py-2 text-right">
                      {formatMoney(day.expense, currency)}
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right font-semibold",
                        day.balance < 0 ? "text-red-600" : "text-emerald-600",
                      )}
                    >
                      {formatMoney(day.balance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
