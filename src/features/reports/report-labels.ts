import { expenseCategoryLabel } from "@/features/expenses/expense-presenter";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import type { ReportLabels } from "@/features/reports/report-export";

export const reportExportLabels: ReportLabels = {
  method: (method) => paymentMethodLabel[method],
  category: (category) => expenseCategoryLabel[category],
};
