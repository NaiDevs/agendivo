import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TOAST_KIND,
  toastService,
  useFeedbackStore,
  type ToastKind,
  type ToastMessage,
} from "@/stores/feedback.store";

const toastIcon: Record<ToastKind, LucideIcon> = {
  [TOAST_KIND.SUCCESS]: CheckCircle2,
  [TOAST_KIND.ERROR]: CircleAlert,
  [TOAST_KIND.INFO]: Info,
};

const toastStyle: Record<ToastKind, string> = {
  [TOAST_KIND.SUCCESS]:
    "border-emerald-200/80 bg-white/95 text-emerald-950 shadow-emerald-950/10",
  [TOAST_KIND.ERROR]:
    "border-red-200/80 bg-white/95 text-red-950 shadow-red-950/10",
  [TOAST_KIND.INFO]:
    "border-sky-200/80 bg-white/95 text-sky-950 shadow-sky-950/10",
};

const toastIconStyle: Record<ToastKind, string> = {
  [TOAST_KIND.SUCCESS]: "bg-emerald-100 text-emerald-600 ring-emerald-200",
  [TOAST_KIND.ERROR]: "bg-red-100 text-red-600 ring-red-200",
  [TOAST_KIND.INFO]: "bg-sky-100 text-sky-600 ring-sky-200",
};

const toastAccentStyle: Record<ToastKind, string> = {
  [TOAST_KIND.SUCCESS]: "from-emerald-400 via-emerald-500 to-teal-500",
  [TOAST_KIND.ERROR]: "from-rose-400 via-red-500 to-orange-500",
  [TOAST_KIND.INFO]: "from-sky-400 via-blue-500 to-indigo-500",
};

const DEFAULT_TOAST_DURATION = 4500;
const TOAST_EXIT_DURATION = 180;

export function GlobalFeedback() {
  const toasts = useFeedbackStore((state) => state.toasts);
  const loadingOperations = useFeedbackStore(
    (state) => state.loadingOperations,
  );
  const activeOperation = loadingOperations[loadingOperations.length - 1];

  return (
    <>
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] grid gap-2 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:w-[24rem]"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>

      {activeOperation !== undefined && (
        <div
          aria-label={activeOperation.message}
          aria-busy="true"
          aria-live="assertive"
          aria-modal="true"
          className="loading-backdrop fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div
            className="loading-card bg-card/95 text-card-foreground relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/70 p-5 shadow-2xl"
            key={activeOperation.id}
          >
            <div className="flex items-center gap-4">
              <div className="relative grid size-14 shrink-0 place-items-center">
                <div className="loader-orbit border-primary/25 absolute inset-0 rounded-full border border-dashed">
                  <span className="bg-primary absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full shadow-[0_0_12px_currentColor]" />
                </div>
                <div className="from-primary to-primary/70 text-primary-foreground grid size-10 place-items-center rounded-2xl bg-gradient-to-br shadow-lg">
                  <Sparkles className="loader-sparkle size-4" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Estamos trabajando</p>
                  <LoaderCircle className="text-primary size-3.5 animate-spin" />
                </div>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {activeOperation.message}
                </p>
                {loadingOperations.length > 1 && (
                  <p className="text-primary mt-1.5 text-[11px] font-semibold">
                    {loadingOperations.length} tareas en proceso
                  </p>
                )}
              </div>
            </div>
            <div className="bg-secondary mt-4 h-1.5 overflow-hidden rounded-full">
              <div className="loading-shimmer from-primary/40 via-primary to-primary/40 h-full w-1/2 rounded-full bg-gradient-to-r" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ToastCardProps {
  toast: ToastMessage;
}

function ToastCard({ toast }: ToastCardProps) {
  const Icon = toastIcon[toast.kind];
  const [isClosing, setIsClosing] = useState(false);
  const duration = toast.duration ?? DEFAULT_TOAST_DURATION;

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsClosing(true), duration);
    return () => window.clearTimeout(timeout);
  }, [duration]);

  useEffect(() => {
    if (!isClosing) {
      return;
    }
    const timeout = window.setTimeout(
      () => toastService.dismiss(toast.id),
      TOAST_EXIT_DURATION,
    );
    return () => window.clearTimeout(timeout);
  }, [isClosing, toast.id]);

  return (
    <div
      className={cn(
        "toast-card pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 pr-3 shadow-xl backdrop-blur-md",
        toastStyle[toast.kind],
        isClosing && "toast-card-exit",
      )}
      role={toast.kind === TOAST_KIND.ERROR ? "alert" : "status"}
      style={{ "--toast-duration": `${duration}ms` } as CSSProperties}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          toastAccentStyle[toast.kind],
        )}
      />
      <div
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1",
          toastIconStyle[toast.kind],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold tracking-tight">{toast.title}</p>
        {toast.description !== undefined && (
          <p className="mt-1 text-xs leading-5 opacity-75">
            {toast.description}
          </p>
        )}
      </div>
      <Button
        aria-label="Cerrar notificación"
        className="-mt-1 size-9 bg-transparent text-current opacity-55 hover:bg-black/5 hover:opacity-100"
        onClick={() => setIsClosing(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X className="size-4" />
      </Button>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/5">
        <div
          className={cn(
            "toast-progress h-full bg-gradient-to-r",
            toastAccentStyle[toast.kind],
          )}
        />
      </div>
    </div>
  );
}
