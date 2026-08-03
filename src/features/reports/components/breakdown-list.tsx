import { formatMoney } from "@/lib/format-money";

interface BreakdownItem {
  label: string;
  total: number;
}

interface BreakdownListProps {
  title: string;
  items: BreakdownItem[];
  currency: string;
  emptyText: string;
}

export function BreakdownList({
  title,
  items,
  currency,
  emptyText,
}: BreakdownListProps) {
  return (
    <div className="surface-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              className="flex items-center justify-between text-sm"
              key={item.label}
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">
                {formatMoney(item.total, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
