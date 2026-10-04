import { Building2, MapPin, Pencil, ReceiptText } from "lucide-react";
import { useState } from "react";

import { DatabaseBackupCard } from "@/features/settings/components/database-backup-card";
import { CloudSyncCard } from "@/features/settings/components/cloud-sync-card";
import { SignOutButton } from "@/features/settings/components/sign-out-button";
import { SubscriptionCard } from "@/features/settings/components/subscription-card";
import { useAppStore } from "@/stores/app.store";
import { Button } from "@/components/ui/button";
import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { FiscalCorrelativeForm } from "@/features/settings/components/fiscal-correlative-form";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const business = useAppStore((state) => state.business);
  const fiscalConfiguration = useAppStore((state) => state.fiscalConfiguration);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState(false);
  const setFiscalDocumentMode = useAppStore(
    (state) => state.setFiscalDocumentMode,
  );
  const isSaving = useAppStore((state) => state.isSaving);
  const invoicesEnabled = fiscalConfiguration?.profile.invoicesEnabled ?? false;
  const authorization = fiscalConfiguration?.authorization ?? null;
  const hasFiscalAuthorization = authorization?.active === true;
  if (business === null) return null;

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Preferencias</p>
        <h1 className="page-title">Configuración</h1>
        <p className="page-description">
          Información del negocio, documentos, nube y respaldos.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <div
          className={`surface-card p-5 sm:p-6 ${editingProfile ? "lg:col-span-2" : ""}`}
        >
          <div
            className={editingProfile ? "hidden" : "flex items-center gap-3"}
          >
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Datos del negocio</h2>
              <p className="text-muted-foreground text-sm">Perfil principal</p>
            </div>
            <Button
              className="ml-auto gap-2"
              onClick={() => setEditingProfile(true)}
              type="button"
              variant="outline"
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
          <dl className={editingProfile ? "hidden" : "mt-6 grid gap-4 text-sm"}>
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
          {editingProfile && (
            <BusinessProfileForm
              business={business}
              onClose={() => setEditingProfile(false)}
            />
          )}
        </div>
        <div
          className={`surface-card p-5 sm:p-6 ${editingFiscal ? "lg:col-span-2" : ""}`}
        >
          <div className={editingFiscal ? "hidden" : "grid gap-5"}>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <ReceiptText className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Documento de cobro</h2>
                <p className="text-muted-foreground text-sm">
                  Elige qué documento emitir al registrar un pago.
                </p>
              </div>
            </div>

            <div className="bg-secondary/70 flex items-center justify-between gap-3 rounded-xl p-4">
              <span
                className={cn(
                  "text-sm font-medium",
                  invoicesEnabled && "text-muted-foreground",
                )}
              >
                Recibo
              </span>
              <button
                aria-checked={invoicesEnabled}
                aria-label="Cambiar entre recibo y factura fiscal"
                className={cn(
                  "focus-visible:ring-ring relative h-7 w-13 rounded-full transition-colors outline-none focus-visible:ring-3 disabled:opacity-50",
                  invoicesEnabled ? "bg-primary" : "bg-muted-foreground/35",
                )}
                disabled={isSaving}
                onClick={() => {
                  const enableInvoices = !invoicesEnabled;
                  void setFiscalDocumentMode(enableInvoices).then((saved) => {
                    if (saved && enableInvoices && !hasFiscalAuthorization) {
                      setEditingFiscal(true);
                    }
                    if (saved && !enableInvoices) setEditingFiscal(false);
                  });
                }}
                role="switch"
                type="button"
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                    invoicesEnabled && "translate-x-6",
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium",
                  !invoicesEnabled && "text-muted-foreground",
                )}
              >
                Factura fiscal
              </span>
            </div>

            {!invoicesEnabled ? (
              <p className="text-muted-foreground text-sm">
                Los pagos emitirán un recibo sencillo sin correlativo fiscal.
              </p>
            ) : !hasFiscalAuthorization || authorization === null ? (
              <div className="grid gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950">
                <p className="text-sm font-medium">
                  Configura el CAI y rango antes de emitir facturas.
                </p>
                <Button onClick={() => setEditingFiscal(true)} type="button">
                  Configurar correlativo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Correlativo fiscal</p>
                  <Button
                    onClick={() => setEditingFiscal(true)}
                    type="button"
                    variant="outline"
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                </div>
                <dl className="grid gap-4 text-sm">
                  <Info label="CAI" value={authorization.cai} />
                  <Info
                    label="Rango"
                    value={`${authorization.rangeStart} - ${authorization.rangeEnd}`}
                  />
                  <Info
                    label="Próximo"
                    value={String(authorization.nextNumber)}
                  />
                  <Info label="Vence" value={authorization.validUntil} />
                </dl>
              </div>
            )}
          </div>
          {editingFiscal && (
            <FiscalCorrelativeForm
              businessName={business.name}
              configuration={fiscalConfiguration}
              onClose={() => setEditingFiscal(false)}
            />
          )}
        </div>
        <DatabaseBackupCard />
        <CloudSyncCard />
        <SubscriptionCard />
        <div className="flex justify-end border-t pt-5 lg:col-span-2">
          <SignOutButton />
        </div>
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
