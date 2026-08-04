import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-message";
import { loadingService, toastService } from "@/stores/feedback.store";

interface ExportButtonProps {
  onExport: () => Promise<boolean>;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleExport = async (): Promise<void> => {
    setBusy(true);
    try {
      const exported = await loadingService.run(
        onExport,
        "Preparando el archivo de Excel…",
      );
      if (exported) {
        toastService.success("Reporte exportado correctamente");
      } else {
        toastService.info("Exportación cancelada");
      }
    } catch (cause: unknown) {
      toastService.error(
        "No pudimos exportar el reporte",
        getErrorMessage(cause),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        className="h-10 gap-2"
        disabled={busy}
        onClick={() => void handleExport()}
        type="button"
        variant="outline"
      >
        <Download className="size-4" />
        {busy ? "Exportando…" : "Exportar a Excel"}
      </Button>
    </div>
  );
}
