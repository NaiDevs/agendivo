import { useState } from "react";

import { DailyReportPanel } from "@/features/reports/daily-report-panel";
import { MonthlyReportPanel } from "@/features/reports/monthly-report-panel";
import { cn } from "@/lib/utils";

const REPORT_TAB = {
  DAILY: "daily",
  MONTHLY: "monthly",
} as const;

type ReportTab = (typeof REPORT_TAB)[keyof typeof REPORT_TAB];

const tabs: { id: ReportTab; label: string }[] = [
  { id: REPORT_TAB.DAILY, label: "Diario" },
  { id: REPORT_TAB.MONTHLY, label: "Mensual" },
];

export function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>(REPORT_TAB.DAILY);

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Reportes</p>
        <h1 className="page-title">Resumen financiero</h1>
        <p className="page-description">
          Ingresos, egresos y balance del negocio por día y por mes.
        </p>
      </header>

      <div
        className="bg-secondary inline-flex w-fit gap-1 rounded-xl p-1"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === REPORT_TAB.DAILY ? (
        <DailyReportPanel />
      ) : (
        <MonthlyReportPanel />
      )}
    </section>
  );
}
