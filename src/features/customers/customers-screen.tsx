import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomerList } from "@/features/customers/components/customer-list";
import { useAppStore } from "@/stores/app.store";
import { useState } from "react";
import type { Customer } from "@/domain/entities/customer";
import { CustomerCustomFieldsSection } from "@/features/customers/components/customer-custom-fields-section";

export function CustomersScreen() {
  const customers = useAppStore((state) => state.customers);
  const [editing, setEditing] = useState<Customer | null>(null);

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Directorio</p>
        <h1 className="page-title">Clientes</h1>
        <p className="page-description">
          Guarda contactos y notas para atenderlos mejor en cada visita.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,0.72fr)_1.28fr]">
        <CustomerForm
          customer={editing}
          onCancelEdit={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
        <CustomerList customers={customers} onEdit={setEditing} />
      </div>
      <CustomerCustomFieldsSection />
    </section>
  );
}
