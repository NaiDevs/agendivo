import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Scissors,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";

import { APP_SECTION, type AppSection } from "@/app/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app.store";

interface NavigationItem {
  id: AppSection;
  label: string;
  icon: LucideIcon;
  upcoming?: boolean;
}

const navigation: NavigationItem[] = [
  { id: APP_SECTION.DASHBOARD, label: "Inicio", icon: LayoutDashboard },
  {
    id: APP_SECTION.APPOINTMENTS,
    label: "Agenda",
    icon: CalendarDays,
  },
  { id: APP_SECTION.CUSTOMERS, label: "Clientes", icon: Users },
  { id: APP_SECTION.EMPLOYEES, label: "Equipo", icon: UsersRound },
  { id: APP_SECTION.SERVICES, label: "Servicios", icon: Scissors },
  {
    id: APP_SECTION.PAYMENTS,
    label: "Caja",
    icon: CircleDollarSign,
    upcoming: true,
  },
  {
    id: APP_SECTION.REPORTS,
    label: "Reportes",
    icon: BarChart3,
    upcoming: true,
  },
];

interface AppShellProps {
  activeSection: AppSection;
  children: ReactNode;
  onNavigate: (section: AppSection) => void;
}

export function AppShell({
  activeSection,
  children,
  onNavigate,
}: AppShellProps) {
  const business = useAppStore((state) => state.business);

  return (
    <div className="bg-background h-screen overflow-hidden lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-sidebar text-sidebar-foreground hidden h-screen flex-col overflow-y-auto border-r border-white/8 lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-lg shadow-black/20">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
              Nai Citas
            </p>
            <p className="truncate font-semibold text-white">
              {business?.name}
            </p>
          </div>
        </div>
        <nav
          className="flex-1 space-y-1 px-3 py-5"
          aria-label="Navegación principal"
        >
          {navigation.map((item) => (
            <NavigationButton
              active={activeSection === item.id}
              item={item}
              key={item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
        <div className="p-3">
          <button
            className={cn(
              "nav-button w-full",
              activeSection === APP_SECTION.SETTINGS && "nav-button-active",
            )}
            onClick={() => onNavigate(APP_SECTION.SETTINGS)}
            type="button"
          >
            <Settings className="size-4" />
            <span>Configuración</span>
          </button>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-3 text-xs text-white/55">
            <WifiOff className="text-primary size-4" />
            <span>Modo local · Sin internet</span>
          </div>
        </div>
      </aside>

      <div className="h-screen min-w-0 overflow-hidden">
        <header className="bg-background/90 sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 backdrop-blur md:px-7 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nai Citas</p>
              <p className="max-w-44 truncate text-sm font-semibold">
                {business?.name}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm lg:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              Datos guardados localmente
            </span>
          </div>
          <button
            aria-label="Abrir configuración"
            className="bg-secondary hover:bg-accent flex size-9 items-center justify-center rounded-full text-sm font-bold transition"
            onClick={() => onNavigate(APP_SECTION.SETTINGS)}
            type="button"
          >
            {business?.name.slice(0, 2).toUpperCase()}
          </button>
        </header>
        <div className="h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
          <main className="mx-auto w-full max-w-[1440px] px-4 py-6 pb-24 md:px-7 lg:px-9 lg:py-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <nav
        className="bg-sidebar fixed right-3 bottom-3 left-3 z-30 grid grid-cols-5 rounded-2xl p-1.5 shadow-2xl lg:hidden"
        aria-label="Navegación móvil"
      >
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] text-white/55 transition",
                active && "bg-primary text-primary-foreground",
              )}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface NavigationButtonProps {
  active: boolean;
  item: NavigationItem;
  onClick: () => void;
}

function NavigationButton({ active, item, onClick }: NavigationButtonProps) {
  const Icon = item.icon;
  return (
    <button
      className={cn("nav-button w-full", active && "nav-button-active")}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" />
      <span>{item.label}</span>
      {item.upcoming === true && (
        <span className="ml-auto rounded-full bg-white/8 px-2 py-0.5 text-[9px] tracking-wide text-white/40 uppercase">
          Próximo
        </span>
      )}
    </button>
  );
}
