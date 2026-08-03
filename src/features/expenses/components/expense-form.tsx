import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Banknote, ChevronDown, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORY, type Expense } from "@/domain/entities/expense";
import { expenseCategoryLabel } from "@/features/expenses/expense-presenter";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/schemas/expense.schema";
import { useAppStore } from "@/stores/app.store";

interface ExpenseFormProps {
  expense: Expense | null;
  onSaved?: () => void;
  onCancelEdit?: () => void;
}

const categories = Object.values(EXPENSE_CATEGORY);

export function ExpenseForm({
  expense,
  onSaved,
  onCancelEdit,
}: ExpenseFormProps) {
  const addExpense = useAppStore((state) => state.addExpense);
  const editExpense = useAppStore((state) => state.editExpense);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: getDefaultValues(expense),
  });

  useEffect(() => {
    clearError();
    reset(getDefaultValues(expense));
  }, [expense, clearError, reset]);

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    const saved =
      expense === null
        ? await addExpense(values)
        : await editExpense(expense.id, values);
    if (saved) {
      reset(getDefaultValues(null));
      onSaved?.();
    }
  });

  return (
    <div className="surface-card flex flex-col overflow-hidden">
      <div className="bg-sidebar flex shrink-0 items-start justify-between gap-4 px-5 py-4 text-white">
        <div>
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {expense === null ? "Nuevo gasto" : "Editar gasto"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {expense === null ? "Registrar gasto" : "Modificar gasto"}
          </h2>
        </div>
        {expense !== null && onCancelEdit !== undefined && (
          <Button
            aria-label="Cancelar edición"
            className="border-white/10 bg-white/8 text-white hover:bg-white/15"
            onClick={onCancelEdit}
            size="icon"
            type="button"
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      <form className="grid gap-4 p-5" onSubmit={onSubmit}>
        {error !== null && (
          <Alert variant="destructive">
            <AlertTitle>No pudimos guardar el gasto</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormSelect
          error={errors.category?.message}
          id="expense-category"
          label="Categoría"
          registration={register("category")}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {expenseCategoryLabel[category]}
            </option>
          ))}
        </FormSelect>
        <div className="grid grid-cols-2 gap-3">
          <div className="field-group">
            <Label htmlFor="expense-amount">Monto</Label>
            <div className="relative">
              <Banknote className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                id="expense-amount"
                min={0}
                step="0.01"
                type="number"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>
          <div className="field-group">
            <Label htmlFor="expense-spent-at">Fecha</Label>
            <Input
              id="expense-spent-at"
              type="datetime-local"
              {...register("spentAt")}
            />
            <FieldError message={errors.spentAt?.message} />
          </div>
        </div>
        <div className="field-group">
          <div className="flex items-center justify-between">
            <Label htmlFor="expense-description">Descripción</Label>
            <span className="text-muted-foreground text-[11px]">Opcional</span>
          </div>
          <textarea
            id="expense-description"
            className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 min-h-16 w-full resize-y rounded-xl border px-3 py-2.5 text-sm shadow-xs transition-all outline-none focus-visible:ring-3"
            placeholder="Ej. Compra de shampoo"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
        <Button className="h-10" disabled={isSaving} type="submit">
          <Banknote className="size-4" />
          {isSaving
            ? "Guardando…"
            : expense === null
              ? "Registrar gasto"
              : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}

interface FormSelectProps {
  children: ReactNode;
  error: string | undefined;
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
}

function FormSelect({
  children,
  error,
  id,
  label,
  registration,
}: FormSelectProps) {
  return (
    <div className="field-group">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 h-11 w-full appearance-none rounded-xl border px-3 pr-9 text-sm shadow-xs transition-all outline-none focus-visible:ring-3"
          id={id}
          {...registration}
        >
          {children}
        </select>
        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function getDefaultValues(expense: Expense | null): ExpenseFormValues {
  return {
    category: expense?.category ?? EXPENSE_CATEGORY.SUPPLIES,
    description: expense?.description ?? "",
    amount: expense === null ? 0 : expense.amount / 100,
    spentAt:
      expense === null
        ? format(new Date(), "yyyy-MM-dd'T'HH:mm")
        : format(new Date(expense.spentAt), "yyyy-MM-dd'T'HH:mm"),
  };
}
