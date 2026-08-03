import { format } from "date-fns";
import { Pencil, Trash2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Expense } from "@/domain/entities/expense";
import { expenseCategoryLabel } from "@/features/expenses/expense-presenter";
import { formatMoney } from "@/lib/format-money";

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  isSaving: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseList({
  expenses,
  currency,
  isSaving,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  return (
    <div className="surface-card min-h-80 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Gastos</h2>
          <p className="text-muted-foreground text-sm">
            {expenses.length} registrados
          </p>
        </div>
      </div>
      {expenses.length === 0 ? (
        <div className="empty-state">
          <Wallet className="text-primary size-7" />
          <p className="text-foreground font-medium">Aún no hay gastos</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Registra el primero con el formulario.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {expenses.map((expense) => (
            <article
              className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 transition hover:shadow-md"
              key={expense.id}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {expenseCategoryLabel[expense.category]}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {format(new Date(expense.spentAt), "dd/MM/yyyy HH:mm")}
                  {expense.description !== null && ` · ${expense.description}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold">
                  {formatMoney(expense.amount, currency)}
                </span>
                <Button
                  aria-label="Editar gasto"
                  disabled={isSaving}
                  onClick={() => onEdit(expense)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  aria-label="Eliminar gasto"
                  disabled={isSaving}
                  onClick={() => onDelete(expense.id)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
