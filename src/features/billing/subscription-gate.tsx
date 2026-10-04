import { CreditCard, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AgendivoBrand } from "@/components/agendivo-brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FEATURE_FLAGS } from "@/config/feature-flags";
import { hasPaidSubscription } from "@/domain/entities/subscription";
import { useAppStore } from "@/stores/app.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSubscriptionStore } from "@/stores/subscription.store";

interface SubscriptionGateProps {
  children: ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const business = useAppStore((state) => state.business);
  const checkedBusinessId = useSubscriptionStore(
    (state) => state.checkedBusinessId,
  );
  const error = useSubscriptionStore((state) => state.error);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const isOpeningCheckout = useSubscriptionStore(
    (state) => state.isOpeningCheckout,
  );
  const subscription = useSubscriptionStore((state) => state.subscription);
  const load = useSubscriptionStore((state) => state.load);
  const openCheckout = useSubscriptionStore((state) => state.openCheckout);
  const reset = useSubscriptionStore((state) => state.reset);
  const isAuthWorking = useAuthStore((state) => state.isWorking);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (business === null) return;

    const refresh = (): void => {
      void load(business.id, business.name);
    };

    refresh();
    window.addEventListener("focus", refresh);
    return (): void => window.removeEventListener("focus", refresh);
  }, [business, load]);

  useEffect(() => reset, [reset]);

  if (business === null) return null;

  const checkedCurrentBusiness = checkedBusinessId === business.id;
  const paid = checkedCurrentBusiness && hasPaidSubscription(subscription);
  if (paid) return children;

  const checking = isLoading || !checkedCurrentBusiness;

  return (
    <main className="setup-background grid min-h-screen place-items-center p-4 sm:p-8">
      <section className="page-enter w-full max-w-xl rounded-3xl border bg-white p-6 shadow-2xl sm:p-9">
        <div className="text-center">
          <AgendivoBrand
            alt="Agendivo"
            className="mx-auto h-12 w-auto max-w-56"
            variant="logo-horizontal-color"
          />
          <p className="eyebrow mt-7">Tu cuenta está lista</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Activa Agendivo para continuar
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
            Tu cuenta y los datos iniciales de {business.name} ya fueron
            creados. La agenda y las demás funciones se habilitarán cuando
            Stripe confirme el pago.
          </p>
        </div>

        <div className="mt-7 grid gap-3 rounded-2xl border bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Plan Agendivo</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Pago seguro procesado directamente por Stripe.
              </p>
            </div>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-emerald-600" />
            No guardamos los datos de tu tarjeta.
          </div>
        </div>

        {error !== null && (
          <Alert className="mt-5" variant="destructive">
            <AlertTitle>No pudimos verificar la suscripción</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid gap-3">
          {FEATURE_FLAGS.stripeSubscriptionButtonEnabled && (
            <Button
              className="h-11"
              disabled={checking || isOpeningCheckout}
              onClick={() => void openCheckout(business.id, business.name)}
              type="button"
            >
              <CreditCard />
              {isOpeningCheckout
                ? "Abriendo Stripe…"
                : "Suscribirme con Stripe"}
            </Button>
          )}
          <Button
            disabled={isLoading}
            onClick={() => void load(business.id, business.name)}
            type="button"
            variant="outline"
          >
            <RefreshCw className={isLoading ? "animate-spin" : undefined} />
            {checking ? "Verificando…" : "Ya pagué, verificar acceso"}
          </Button>
          <Button
            disabled={isAuthWorking}
            onClick={() => void signOut()}
            type="button"
            variant="ghost"
          >
            <LogOut />
            {isAuthWorking ? "Cerrando sesión…" : "Usar otra cuenta"}
          </Button>
        </div>
      </section>
    </main>
  );
}
