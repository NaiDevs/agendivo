import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomerList } from "@/features/customers/components/customer-list";
import { useAppStore } from "@/stores/app.store";

export function CustomersScreen() {
  const customers = useAppStore((state) => state.customers);

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
        <CustomerForm />
        <CustomerList customers={customers} />
      </div>
    </section>
  );
}
