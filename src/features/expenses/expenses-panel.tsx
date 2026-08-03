import { useState } from "react";

import type { Expense } from "@/domain/entities/expense";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpenseList } from "@/features/expenses/components/expense-list";
import { useAppStore } from "@/stores/app.store";

export function ExpensesPanel() {
  const business = useAppStore((state) => state.business);
  const expenses = useAppStore((state) => state.expenses);
  const isSaving = useAppStore((state) => state.isSaving);
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const currency = business?.currency ?? "GTQ";
  const [editing, setEditing] = useState<Expense | null>(null);

  const onDelete = (expenseId: string): void => {
    if (window.confirm("¿Eliminar este gasto?")) {
      if (editing?.id === expenseId) {
        setEditing(null);
      }
      void deleteExpense(expenseId);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,0.72fr)_1.28fr]">
      <ExpenseForm
        expense={editing}
        onCancelEdit={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />
      <ExpenseList
        currency={currency}
        expenses={expenses}
        isSaving={isSaving}
        onDelete={onDelete}
        onEdit={setEditing}
      />
    </div>
  );
}
