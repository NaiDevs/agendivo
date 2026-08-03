import { Clock3, Scissors } from "lucide-react";

import { ServiceForm } from "@/features/services/components/service-form";
import { formatMoney } from "@/lib/format-money";
import { useAppStore } from "@/stores/app.store";

export function ServicesScreen() {
  const business = useAppStore((state) => state.business);
  const services = useAppStore((state) => state.services);
  const currency = business?.currency ?? "GTQ";

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Catálogo</p>
        <h1 className="page-title">Servicios y precios</h1>
        <p className="page-description">
          Crea la oferta que aparecerá al registrar una cita.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.72fr)_1.28fr]">
        <ServiceForm />
        <div className="surface-card min-h-80 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Catálogo actual</h2>
              <p className="text-muted-foreground text-sm">
                {services.length} servicios disponibles
              </p>
            </div>
          </div>
          {services.length === 0 ? (
            <div className="empty-state">
              <Scissors className="text-primary size-7" />
              <p className="font-medium">Aún no hay servicios</p>
              <p className="text-muted-foreground max-w-xs text-sm">
                Crea el primero con su duración y precio.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <article
                  className="rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  key={service.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="bg-secondary flex size-10 items-center justify-center rounded-xl">
                      <Scissors className="text-primary size-5" />
                    </div>
                    <span className="text-primary text-base font-bold">
                      {formatMoney(service.price, currency)}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold">{service.name}</h3>
                  <p className="text-muted-foreground mt-1 min-h-5 truncate text-sm">
                    {service.description ?? "Servicio sin descripción"}
                  </p>
                  <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs font-medium">
                    <Clock3 className="size-4" />
                    {service.durationMinutes} minutos
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
