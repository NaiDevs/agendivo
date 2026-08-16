import { LogOut, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import { AppShell } from "@/app/app-shell";
import { APP_SECTION, type AppSection } from "@/app/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/features/auth/auth-screen";
import { CustomersScreen } from "@/features/customers/customers-screen";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { CashScreen } from "@/features/cash/cash-screen";
import { EmployeesScreen } from "@/features/employees/employees-screen";
import { ReportsScreen } from "@/features/reports/reports-screen";
import { ServicesScreen } from "@/features/services/services-screen";
import { SettingsScreen } from "@/features/settings/settings-screen";
import { PendingSyncDialog } from "@/features/sync/pending-sync-dialog";
import { BusinessSetupForm } from "@/features/settings/components/business-setup-form";
import { RestoreBackupButton } from "@/features/settings/components/database-backup-card";
import { APP_PHASE, useAppStore } from "@/stores/app.store";
import { AUTH_PHASE, useAuthStore } from "@/stores/auth.store";
import { useSyncStore } from "@/stores/sync.store";

const AppointmentsScreen = lazy(async () => {
  const module = await import("@/features/appointments/appointments-screen");
  return { default: module.AppointmentsScreen };
});

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>(
    APP_SECTION.DASHBOARD,
  );
  const phase = useAppStore((state) => state.phase);
  const error = useAppStore((state) => state.error);
  const initialize = useAppStore((state) => state.initialize);
  const business = useAppStore((state) => state.business);
  const fiscalConfiguration = useAppStore((state) => state.fiscalConfiguration);
  const appointments = useAppStore((state) => state.appointments);
  const customers = useAppStore((state) => state.customers);
  const employees = useAppStore((state) => state.employees);
  const services = useAppStore((state) => state.services);
  const authPhase = useAuthStore((state) => state.phase);
  const authUser = useAuthStore((state) => state.user);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const isAuthWorking = useAuthStore((state) => state.isWorking);
  const mustConfigurePassword = useAuthStore(
    (state) => state.mustConfigurePassword,
  );
  const signOut = useAuthStore((state) => state.signOut);
  const syncNow = useSyncStore((state) => state.syncNow);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (authPhase === AUTH_PHASE.AUTHENTICATED && authUser !== null) {
      void initialize(authUser.id);
    } else if (authPhase === AUTH_PHASE.UNCONFIGURED) {
      void initialize();
    }
  }, [authPhase, authUser, initialize]);

  useEffect(() => {
    if (
      authPhase !== AUTH_PHASE.AUTHENTICATED ||
      phase !== APP_PHASE.READY ||
      business === null
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncNow(business);
    }, 1200);

    return (): void => window.clearTimeout(timeoutId);
  }, [
    appointments,
    authPhase,
    business,
    customers,
    employees,
    fiscalConfiguration,
    phase,
    services,
    syncNow,
  ]);

  if (authPhase === AUTH_PHASE.IDLE || authPhase === AUTH_PHASE.LOADING) {
    return <StartupLoader message="Validando tu sesión…" />;
  }

  if (
    authPhase === AUTH_PHASE.UNAUTHENTICATED ||
    authPhase === AUTH_PHASE.ERROR ||
    mustConfigurePassword
  ) {
    return <AuthScreen />;
  }

  if (phase === APP_PHASE.IDLE || phase === APP_PHASE.LOADING) {
    return <StartupLoader message="Preparando tu espacio local…" />;
  }

  if (phase === APP_PHASE.ERROR) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert className="max-w-xl" variant="destructive">
          <AlertTitle>No pudimos iniciar Agendivo</AlertTitle>
          <AlertDescription className="mt-2 grid gap-4">
            <span>{error}</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => void initialize(authUser?.id)}
              >
                Reintentar
              </Button>
              <Button
                disabled={isAuthWorking}
                variant="outline"
                onClick={() => void signOut()}
              >
                <LogOut />
                {isAuthWorking ? "Cerrando…" : "Usar otra cuenta"}
              </Button>
            </div>
            <RestoreBackupButton />
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (phase === APP_PHASE.SETUP) {
    return (
      <main className="setup-background grid min-h-screen place-items-center p-4 sm:p-8">
        <div className="page-enter w-full max-w-4xl">
          <div className="mb-6 text-center">
            <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-2xl shadow-lg">
              <Sparkles className="size-5" />
            </div>
            <p className="eyebrow mt-4">Bienvenido a Agendivo</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Comencemos por tu negocio
            </h1>
          </div>
          <BusinessSetupForm />
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-muted-foreground text-xs">
              ¿Ya utilizabas Agendivo en este equipo o en otro?
            </p>
            <RestoreBackupButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <AppShell activeSection={activeSection} onNavigate={setActiveSection}>
        {renderSection(activeSection, setActiveSection)}
      </AppShell>
      <PendingSyncDialog />
    </>
  );
}

function renderSection(
  section: AppSection,
  onNavigate: (section: AppSection) => void,
) {
  switch (section) {
    case APP_SECTION.CUSTOMERS:
      return <CustomersScreen />;
    case APP_SECTION.EMPLOYEES:
      return <EmployeesScreen />;
    case APP_SECTION.SERVICES:
      return <ServicesScreen />;
    case APP_SECTION.SETTINGS:
      return <SettingsScreen />;
    case APP_SECTION.APPOINTMENTS:
      return (
        <Suspense fallback={<SectionLoader />}>
          <AppointmentsScreen />
        </Suspense>
      );
    case APP_SECTION.PAYMENTS:
      return <CashScreen />;
    case APP_SECTION.REPORTS:
      return <ReportsScreen />;
    case APP_SECTION.DASHBOARD:
      return <DashboardScreen onNavigate={onNavigate} />;
  }
}

function StartupLoader({ message }: { message: string }) {
  return (
    <main className="bg-sidebar flex min-h-screen items-center justify-center p-8 text-white">
      <div className="text-center">
        <div className="bg-primary mx-auto flex size-12 animate-pulse items-center justify-center rounded-2xl">
          <Sparkles className="size-5" />
        </div>
        <p className="mt-4 text-sm text-white/55">{message}</p>
      </div>
    </main>
  );
}

function SectionLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <p className="text-muted-foreground text-sm">Preparando la agenda…</p>
    </div>
  );
}

export default App;
