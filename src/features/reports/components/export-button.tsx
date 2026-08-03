import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-message";

interface ExportButtonProps {
  onExport: () => Promise<boolean>;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await onExport();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
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
      {error !== null && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
