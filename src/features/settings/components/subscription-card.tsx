import { CreditCard, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_STATUS } from "@/domain/entities/subscription";
import { useAppStore } from "@/stores/app.store";
import { useSubscriptionStore } from "@/stores/subscription.store";

export function SubscriptionCard() {
  const business = useAppStore((state) => state.business);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const error = useSubscriptionStore((state) => state.error);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const isOpeningCheckout = useSubscriptionStore(
    (state) => state.isOpeningCheckout,
  );
  const load = useSubscriptionStore((state) => state.load);
  const openCheckout = useSubscriptionStore((state) => state.openCheckout);

  useEffect(() => {
    if (business === null) return;

    const refresh = (): void => {
      void load(business.id);
    };

    refresh();
    window.addEventListener("focus", refresh);
    return (): void => window.removeEventListener("focus", refresh);
  }, [business, load]);

  if (business === null) return null;

  const active =
    subscription?.status === SUBSCRIPTION_STATUS.ACTIVE ||
    subscription?.status === SUBSCRIPTION_STATUS.TRIALING;

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <CreditCard className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">Plan Agendivo</h2>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? "Consultando…"
              : subscriptionLabel(subscription?.status)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border bg-white p-4">
        {active ? (
          <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
        ) : (
          <TriangleAlert className="mt-0.5 size-5 text-amber-600" />
        )}
        <div>
          <p className="font-medium">
            {active ? "Suscripción activa" : "Activa tu suscripción"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {error ?? subscriptionDescription(subscription?.currentPeriodEnd)}
          </p>
        </div>
      </div>

      {!active && (
        <Button
          className="mt-4 w-full"
          disabled={isOpeningCheckout}
          onClick={() => void openCheckout(business.id)}
          type="button"
        >
          {isOpeningCheckout ? "Abriendo Stripe…" : "Suscribirme con Stripe"}
        </Button>
      )}
    </div>
  );
}

function subscriptionLabel(status: string | undefined): string {
  if (status === SUBSCRIPTION_STATUS.ACTIVE) return "Activo";
  if (status === SUBSCRIPTION_STATUS.TRIALING) return "Periodo de prueba";
  if (status === SUBSCRIPTION_STATUS.PAST_DUE) return "Pago pendiente";
  if (status === SUBSCRIPTION_STATUS.CANCELED) return "Cancelado";
  if (status === SUBSCRIPTION_STATUS.CHECKOUT_PENDING)
    return "Registro pendiente";
  return "Sin suscripción";
}

function subscriptionDescription(periodEnd: string | null | undefined): string {
  if (periodEnd !== null && periodEnd !== undefined) {
    return `Vigente hasta ${new Date(periodEnd).toLocaleDateString("es-HN")}.`;
  }
  return "El pago se procesa de forma segura en Stripe.";
}
