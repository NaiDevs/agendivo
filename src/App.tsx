import { BarChart3, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import { AppShell } from "@/app/app-shell";
import { APP_SECTION, type AppSection } from "@/app/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CustomersScreen } from "@/features/customers/customers-screen";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { EmployeesScreen } from "@/features/employees/employees-screen";
import { PaymentsScreen } from "@/features/payments/payments-screen";
import { ServicesScreen } from "@/features/services/services-screen";
import { SettingsScreen } from "@/features/settings/settings-screen";
import { BusinessSetupForm } from "@/features/settings/components/business-setup-form";
import { UpcomingScreen } from "@/features/shared/upcoming-screen";
import { APP_PHASE, useAppStore } from "@/stores/app.store";

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

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (phase === APP_PHASE.IDLE || phase === APP_PHASE.LOADING) {
    return (
      <main className="bg-sidebar flex min-h-screen items-center justify-center p-8 text-white">
        <div className="text-center">
          <div className="bg-primary mx-auto flex size-12 animate-pulse items-center justify-center rounded-2xl">
            <Sparkles className="size-5" />
          </div>
          <p className="mt-4 text-sm text-white/55">
            Preparando tu espacio local…
          </p>
        </div>
      </main>
    );
  }

  if (phase === APP_PHASE.ERROR) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Alert className="max-w-xl" variant="destructive">
          <AlertTitle>No pudimos iniciar Nai Citas</AlertTitle>
          <AlertDescription className="mt-2 grid gap-4">
            <span>{error}</span>
            <Button variant="outline" onClick={() => void initialize()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (phase === APP_PHASE.SETUP) {
    return (
      <main className="setup-background grid min-h-screen place-items-center p-4 sm:p-8">
        <div className="page-enter w-full max-w-2xl">
          <div className="mb-6 text-center">
            <div className="bg-primary text-primary-foreground mx-auto flex size-12 items-center justify-center rounded-2xl shadow-lg">
              <Sparkles className="size-5" />
            </div>
            <p className="eyebrow mt-4">Bienvenido a Nai Citas</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Comencemos por tu negocio
            </h1>
          </div>
          <BusinessSetupForm />
        </div>
      </main>
    );
  }

  return (
    <AppShell activeSection={activeSection} onNavigate={setActiveSection}>
      {renderSection(activeSection, setActiveSection)}
    </AppShell>
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
      return <PaymentsScreen />;
    case APP_SECTION.REPORTS:
      return (
        <UpcomingScreen
          icon={BarChart3}
          title="Reportes del negocio"
          description="Los resúmenes diarios y mensuales usarán los movimientos registrados en caja."
        />
      );
    case APP_SECTION.DASHBOARD:
      return <DashboardScreen onNavigate={onNavigate} />;
  }
}

function SectionLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <p className="text-muted-foreground text-sm">Preparando la agenda…</p>
    </div>
  );
}

export default App;
