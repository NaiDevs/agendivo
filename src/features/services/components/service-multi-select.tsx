import { Check } from "lucide-react";

import { FieldError } from "@/components/field-error";
import type { Service } from "@/domain/entities/service";
import { formatMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";

interface ServiceMultiSelectProps {
  currency: string;
  error?: string;
  onChange: (serviceIds: string[]) => void;
  selectedIds: string[];
  services: Service[];
}

export function ServiceMultiSelect({
  currency,
  error,
  onChange,
  selectedIds,
  services,
}: ServiceMultiSelectProps) {
  const toggle = (serviceId: string): void => {
    onChange(
      selectedIds.includes(serviceId)
        ? selectedIds.filter((id) => id !== serviceId)
        : [...selectedIds, serviceId],
    );
  };

  return (
    <fieldset className="field-group">
      <legend className="text-sm leading-none font-medium">Servicios</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map((service) => {
          const selected = selectedIds.includes(service.id);
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition",
                selected
                  ? "border-primary bg-primary/8"
                  : "bg-card hover:border-primary/40",
              )}
              key={service.id}
              onClick={() => toggle(service.id)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border",
                  selected && "border-primary bg-primary text-white",
                )}
              >
                {selected && <Check className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {service.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {service.durationMinutes} min ·{" "}
                  {formatMoney(service.price, currency)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
