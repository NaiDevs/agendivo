import { CloudUpload, Wifi } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import { SYNC_STATUS, useSyncStore } from "@/stores/sync.store";

export function PendingSyncDialog() {
  const business = useAppStore((state) => state.business);
  const dismissPendingPrompt = useSyncStore(
    (state) => state.dismissPendingPrompt,
  );
  const isOpen = useSyncStore((state) => state.isPromptOpen);
  const loadPendingChanges = useSyncStore((state) => state.loadPendingChanges);
  const openPendingPrompt = useSyncStore((state) => state.openPendingPrompt);
  const syncNow = useSyncStore((state) => state.syncNow);
  const status = useSyncStore((state) => state.status);

  useEffect(() => {
    void loadPendingChanges();
  }, [loadPendingChanges]);

  useEffect(() => {
    window.addEventListener("online", openPendingPrompt);
    return (): void => window.removeEventListener("online", openPendingPrompt);
  }, [openPendingPrompt]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") dismissPendingPrompt();
    };
    window.addEventListener("keydown", closeOnEscape);
    return (): void => window.removeEventListener("keydown", closeOnEscape);
  }, [dismissPendingPrompt, isOpen]);

  if (!isOpen || business === null) return null;

  const isSyncing = status === SYNC_STATUS.SYNCING;

  const handleSync = async (): Promise<void> => {
    const synchronized = await syncNow(business);
    if (synchronized) dismissPendingPrompt();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-describedby="pending-sync-description"
        aria-labelledby="pending-sync-title"
        aria-modal="true"
        className="surface-card page-enter w-full max-w-md p-6 shadow-2xl"
        role="dialog"
      >
        <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
          <CloudUpload className="size-6" />
        </div>
        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <Wifi className="size-4" />
          Internet disponible
        </div>
        <h2 className="mt-2 text-xl font-semibold" id="pending-sync-title">
          Tienes cambios pendientes
        </h2>
        <p
          className="text-muted-foreground mt-2 text-sm leading-6"
          id="pending-sync-description"
        >
          Trabajaste sin conexión y hay información guardada únicamente en este
          dispositivo. ¿Deseas respaldarla ahora en Supabase?
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
            disabled={isSyncing}
            onClick={dismissPendingPrompt}
            type="button"
            variant="outline"
          >
            Más tarde
          </Button>
          <Button
            disabled={isSyncing}
            onClick={() => void handleSync()}
            type="button"
          >
            <CloudUpload className={isSyncing ? "animate-pulse" : undefined} />
            {isSyncing ? "Sincronizando…" : "Sincronizar ahora"}
          </Button>
        </div>
      </section>
    </div>
  );
}
