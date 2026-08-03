import type { LucideIcon } from "lucide-react";
import { CalendarDays, Construction } from "lucide-react";

interface UpcomingScreenProps {
  description: string;
  icon?: LucideIcon;
  title: string;
}

export function UpcomingScreen({
  description,
  icon: Icon = CalendarDays,
  title,
}: UpcomingScreenProps) {
  return (
    <section className="page-enter grid min-h-[60vh] place-items-center">
      <div className="surface-card max-w-lg p-8 text-center sm:p-12">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-7" />
        </div>
        <div className="bg-secondary text-muted-foreground mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Construction className="size-3.5" />
          Siguiente etapa
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-3 leading-6">{description}</p>
      </div>
    </section>
  );
}
