import {
  Building2,
  Database,
  HardDrive,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { DatabaseBackupCard } from "@/features/settings/components/database-backup-card";
import { useAppStore } from "@/stores/app.store";

export function SettingsScreen() {
  const business = useAppStore((state) => state.business);
  if (business === null) return null;

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Preferencias</p>
        <h1 className="page-title">Configuración</h1>
        <p className="page-description">
          Información del negocio y estado del almacenamiento local.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Datos del negocio</h2>
              <p className="text-muted-foreground text-sm">Perfil principal</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 text-sm">
            <Info label="Nombre" value={business.name} />
            <Info label="Teléfono" value={business.phone ?? "No registrado"} />
            <Info label="Correo" value={business.email ?? "No registrado"} />
            <Info
              label="Dirección"
              value={business.address ?? "No registrada"}
              icon={MapPin}
            />
            <Info label="Moneda" value={business.currency} />
          </dl>
        </div>
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Database className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Base de datos local</h2>
              <p className="text-muted-foreground text-sm">
                SQLite funcionando correctamente
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <Status
              icon={HardDrive}
              title="Persistencia activa"
              description="Tus cambios permanecen después de cerrar la aplicación."
            />
            <Status
              icon={ShieldCheck}
              title="Modo offline"
              description="Clientes, equipo y servicios no necesitan internet."
            />
          </div>
          <div className="bg-secondary/70 mt-5 rounded-xl p-4 text-sm">
            <p className="font-medium">Almacenamiento protegido</p>
            <p className="text-muted-foreground mt-1">
              Puedes crear y restaurar copias desde esta misma pantalla.
            </p>
          </div>
        </div>
        <DatabaseBackupCard />
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground flex items-center gap-2">
        {Icon !== undefined && <Icon className="size-4" />}
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Status({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof HardDrive;
  title: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-white p-4">
      <Icon className="mt-0.5 size-5 text-emerald-600" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
    </div>
  );
}
