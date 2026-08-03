import {
  CalendarDays,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { FinanceSummary } from "@/domain/services/report.service";
import { formatMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  summary: FinanceSummary;
  currency: string;
}

export function SummaryCards({ summary, currency }: SummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card
        icon={<TrendingUp className="size-5" />}
        label="Ingresos"
        value={formatMoney(summary.incomeTotal, currency)}
      />
      <Card
        icon={<TrendingDown className="size-5" />}
        label="Egresos"
        value={formatMoney(summary.expenseTotal, currency)}
      />
      <Card
        emphasis={summary.balance < 0 ? "negative" : "positive"}
        icon={<Wallet className="size-5" />}
        label="Balance"
        value={formatMoney(summary.balance, currency)}
      />
      <Card
        icon={<CalendarDays className="size-5" />}
        label="Citas"
        value={String(summary.appointmentCount)}
      />
      <Card
        icon={<Receipt className="size-5" />}
        label="Pagos"
        value={String(summary.paymentCount)}
      />
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: "positive" | "negative";
}

function Card({ icon, label, value, emphasis }: CardProps) {
  return (
    <div className="surface-card p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold",
          emphasis === "negative" && "text-red-600",
          emphasis === "positive" && "text-emerald-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}
