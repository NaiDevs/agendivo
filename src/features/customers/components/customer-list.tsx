import { Mail, Phone, Users } from "lucide-react";
import type { Customer } from "@/domain/entities/customer";

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="surface-card min-h-80 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Directorio</h2>
          <p className="text-muted-foreground text-sm">
            {customers.length} registrados
          </p>
        </div>
      </div>
      {customers.length === 0 ? (
        <div className="empty-state">
          <Users className="text-primary size-7" />
          <p className="text-foreground font-medium">Aún no hay clientes</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Registra el primero con el formulario.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {customers.map((customer) => (
            <article
              className="rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              key={customer.id}
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary text-primary flex size-10 items-center justify-center rounded-xl font-semibold">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customer.name}</p>
                  <p className="text-muted-foreground text-xs">Cliente</p>
                </div>
              </div>
              <div className="text-muted-foreground mt-4 grid gap-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {customer.phone ?? "Sin teléfono"}
                </p>
                <p className="flex items-center gap-2 truncate">
                  <Mail className="size-4" />
                  {customer.email ?? "Sin correo"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
