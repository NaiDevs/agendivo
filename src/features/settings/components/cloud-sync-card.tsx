import { AlertTriangle, CheckCircle2, Cloud, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import { SYNC_STATUS, useSyncStore } from "@/stores/sync.store";

export function CloudSyncCard() {
  const business = useAppStore((state) => state.business);
  const status = useSyncStore((state) => state.status);
  const error = useSyncStore((state) => state.error);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const syncNow = useSyncStore((state) => state.syncNow);

  if (business === null || status === SYNC_STATUS.UNAVAILABLE) {
    return null;
  }

  const isSyncing = status === SYNC_STATUS.SYNCING;

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <Cloud className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">Sincronización en la nube</h2>
          <p className="text-muted-foreground text-sm">Agendivo · Supabase</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4">
        <div className="flex items-start gap-3">
          <SyncIcon status={status} />
          <div className="min-w-0">
            <p className="font-medium">{syncTitle(status)}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {syncDescription(status, lastSyncedAt, error)}
            </p>
          </div>
        </div>
      </div>

      <Button
        className="mt-4 w-full"
        disabled={isSyncing}
        onClick={() => void syncNow(business)}
        type="button"
        variant="outline"
      >
        <RefreshCw className={isSyncing ? "animate-spin" : undefined} />
        {isSyncing ? "Sincronizando…" : "Sincronizar ahora"}
      </Button>
    </div>
  );
}

function SyncIcon({ status }: { status: string }) {
  if (status === SYNC_STATUS.ERROR) {
    return <AlertTriangle className="mt-0.5 size-5 text-amber-600" />;
  }
  if (status === SYNC_STATUS.SYNCED) {
    return <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />;
  }
  return <Cloud className="text-primary mt-0.5 size-5" />;
}

function syncTitle(status: string): string {
  if (status === SYNC_STATUS.ERROR) return "Sincronización pendiente";
  if (status === SYNC_STATUS.SYNCED) return "Datos respaldados";
  if (status === SYNC_STATUS.SYNCING) return "Enviando cambios";
  return "Lista para sincronizar";
}

function syncDescription(
  status: string,
  lastSyncedAt: string | null,
  error: string | null,
): string {
  if (status === SYNC_STATUS.ERROR) {
    return error ?? "Se reintentará cuando haya conexión.";
  }
  if (lastSyncedAt !== null) {
    return `Última copia: ${new Date(lastSyncedAt).toLocaleString("es-HN")}.`;
  }
  return "Clientes, equipo, servicios y citas se copiarán de forma segura.";
}
