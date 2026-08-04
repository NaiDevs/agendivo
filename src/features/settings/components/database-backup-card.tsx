import { confirm } from "@tauri-apps/plugin-dialog";
import {
  ArchiveRestore,
  CalendarClock,
  DatabaseBackup,
  Download,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BACKUP_RESULT,
  createDatabaseBackup,
  restoreDatabaseBackup,
  selectRestoreCandidate,
  type BackupSummary,
} from "@/infrastructure/backup/database-backup";
import { getErrorMessage } from "@/lib/error-message";
import { APP_PHASE, useAppStore } from "@/stores/app.store";
import { loadingService, toastService } from "@/stores/feedback.store";

const BACKUP_ACTION = {
  BACKUP: "backup",
  RESTORE: "restore",
} as const;

type BackupAction = (typeof BACKUP_ACTION)[keyof typeof BACKUP_ACTION];

export function DatabaseBackupCard() {
  const initialize = useAppStore((state) => state.initialize);
  const [activeAction, setActiveAction] = useState<BackupAction | null>(null);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);

  const handleBackup = async (): Promise<void> => {
    setActiveAction(BACKUP_ACTION.BACKUP);
    try {
      const result = await loadingService.run(
        createDatabaseBackup,
        "Creando una copia consistente de tus datos…",
      );
      if (result.status === BACKUP_RESULT.SAVED && result.path !== undefined) {
        setLastBackupPath(result.path);
        toastService.success(
          "Respaldo creado correctamente",
          "Tu información quedó guardada en el archivo seleccionado.",
        );
      }
    } catch (error: unknown) {
      toastService.error(
        "No pudimos crear el respaldo",
        getErrorMessage(error),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleRestore = async (): Promise<void> => {
    setActiveAction(BACKUP_ACTION.RESTORE);
    try {
      await executeDatabaseRestore(initialize);
    } finally {
      setActiveAction(null);
    }
  };

  const isBusy = activeAction !== null;

  return (
    <div className="surface-card overflow-hidden lg:col-span-2">
      <div className="from-primary/10 via-card to-card grid gap-5 bg-gradient-to-br p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary text-primary-foreground grid size-12 shrink-0 place-items-center rounded-2xl shadow-lg">
            <DatabaseBackup className="size-6" />
          </div>
          <div>
            <p className="eyebrow">Protección de datos</p>
            <h2 className="mt-1 text-lg font-semibold">
              Respaldos y restauración
            </h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              Guarda una copia completa de clientes, citas, pagos, gastos y
              configuración. Todo permanece local y bajo tu control.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-48">
          <Button
            className="h-11 gap-2"
            disabled={isBusy}
            onClick={() => void handleBackup()}
            type="button"
          >
            <Download className="size-4" />
            {activeAction === BACKUP_ACTION.BACKUP
              ? "Respaldando…"
              : "Crear respaldo"}
          </Button>
          <Button
            className="h-11 gap-2"
            disabled={isBusy}
            onClick={() => void handleRestore()}
            type="button"
            variant="outline"
          >
            <ArchiveRestore className="size-4" />
            {activeAction === BACKUP_ACTION.RESTORE
              ? "Restaurando…"
              : "Restaurar respaldo"}
          </Button>
        </div>
      </div>
      <div className="grid border-t sm:grid-cols-2">
        <BackupFeature
          description="La copia se genera desde una instantánea consistente de SQLite."
          icon={ShieldCheck}
          title="Respaldo seguro"
        />
        <BackupFeature
          description={
            lastBackupPath === null
              ? "Elige cuándo y dónde guardar cada copia."
              : "Respaldo creado durante esta sesión."
          }
          icon={CalendarClock}
          title={
            lastBackupPath === null ? "Control manual" : "Copia actualizada"
          }
        />
      </div>
    </div>
  );
}

export function RestoreBackupButton() {
  const initialize = useAppStore((state) => state.initialize);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);
    try {
      await executeDatabaseRestore(initialize);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      className="h-10 gap-2"
      disabled={isRestoring}
      onClick={() => void handleRestore()}
      type="button"
      variant="outline"
    >
      <ArchiveRestore className="size-4" />
      {isRestoring ? "Restaurando…" : "Restaurar un respaldo"}
    </Button>
  );
}

interface BackupFeatureProps {
  description: string;
  icon: typeof ShieldCheck;
  title: string;
}

function BackupFeature({ description, icon: Icon, title }: BackupFeatureProps) {
  return (
    <div className="flex gap-3 p-4 sm:p-5 sm:[&+&]:border-l">
      <Icon className="text-primary mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          {description}
        </p>
      </div>
    </div>
  );
}

function createConfirmationMessage(summary: BackupSummary): string {
  const business = summary.businessName ?? "Sin negocio configurado";
  return [
    `Se restaurará el respaldo de: ${business}.`,
    "",
    `${summary.counts.customers} clientes · ${summary.counts.appointments} citas`,
    `${summary.counts.payments} pagos · ${summary.counts.expenses} gastos`,
    "",
    "Los datos actuales serán reemplazados. Nai Citas creará una copia de recuperación automática antes de continuar.",
  ].join("\n");
}

async function executeDatabaseRestore(
  initialize: () => Promise<void>,
): Promise<void> {
  try {
    const candidate = await loadingService.run(
      selectRestoreCandidate,
      "Validando la integridad del respaldo…",
    );
    if (candidate === null) {
      return;
    }

    const accepted = await confirm(
      createConfirmationMessage(candidate.summary),
      {
        cancelLabel: "Cancelar",
        kind: "warning",
        okLabel: "Restaurar datos",
        title: "Confirmar restauración",
      },
    );
    if (!accepted) {
      return;
    }

    await loadingService.run(async (): Promise<void> => {
      await restoreDatabaseBackup(candidate);
      await initialize();
      const state = useAppStore.getState();
      if (state.phase === APP_PHASE.ERROR) {
        throw new Error(
          state.error ?? "No pudimos recargar los datos restaurados.",
        );
      }
    }, "Restaurando y recargando tus datos…");
    toastService.success(
      "Respaldo restaurado correctamente",
      "Nai Citas ya está usando la información recuperada.",
    );
  } catch (error: unknown) {
    toastService.error(
      "No pudimos restaurar el respaldo",
      getErrorMessage(error),
    );
  }
}
