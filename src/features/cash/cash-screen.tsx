import { useState } from "react";

import { cn } from "@/lib/utils";
import { ExpensesPanel } from "@/features/expenses/expenses-panel";
import { PaymentsPanel } from "@/features/payments/payments-panel";

const CASH_TAB = {
  PAYMENTS: "payments",
  EXPENSES: "expenses",
} as const;

type CashTab = (typeof CASH_TAB)[keyof typeof CASH_TAB];

const tabs: { id: CashTab; label: string }[] = [
  { id: CASH_TAB.PAYMENTS, label: "Pagos" },
  { id: CASH_TAB.EXPENSES, label: "Gastos" },
];

export function CashScreen() {
  const [activeTab, setActiveTab] = useState<CashTab>(CASH_TAB.PAYMENTS);

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Caja</p>
        <h1 className="page-title">Movimientos</h1>
        <p className="page-description">
          Registra el dinero que entra y sale del negocio.
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

      {activeTab === CASH_TAB.PAYMENTS ? <PaymentsPanel /> : <ExpensesPanel />}
    </section>
  );
}
