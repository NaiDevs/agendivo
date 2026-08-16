import { Mail, Pencil, Phone, UsersRound } from "lucide-react";
import { useState } from "react";

import { EmployeeForm } from "@/features/employees/components/employee-form";
import { useAppStore } from "@/stores/app.store";
import {
  EMPLOYEE_ACCOUNT_ROLE,
  type Employee,
} from "@/domain/entities/employee";
import { Button } from "@/components/ui/button";

export function EmployeesScreen() {
  const employees = useAppStore((state) => state.employees);
  const [editing, setEditing] = useState<Employee | null>(null);

  return (
    <section className="page-enter grid gap-6">
      <header>
        <p className="eyebrow">Administración</p>
        <h1 className="page-title">Tu equipo</h1>
        <p className="page-description">
          Organiza a los profesionales que atenderán las citas.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.72fr)_1.28fr]">
        <EmployeeForm
          employee={editing}
          onCancelEdit={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
        <div className="surface-card min-h-80 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Profesionales</h2>
              <p className="text-muted-foreground text-sm">
                {employees.length} en el equipo
              </p>
            </div>
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
              Activos
            </span>
          </div>
          {employees.length === 0 ? (
            <div className="empty-state">
              <UsersRound className="text-primary size-7" />
              <p className="font-medium">Tu equipo empieza aquí</p>
              <p className="text-muted-foreground max-w-xs text-sm">
                Agrega al primer profesional para preparar la agenda.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {employees.map((employee) => (
                <article
                  className="rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  key={employee.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl font-semibold">
                      {employee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{employee.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {employee.accountRole === EMPLOYEE_ACCOUNT_ROLE.OWNER
                          ? "Propietario"
                          : "Miembro del equipo"}
                      </p>
                    </div>
                    <Button
                      aria-label="Editar profesional"
                      className="ml-auto"
                      onClick={() => setEditing(employee)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-4 grid gap-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Phone className="size-4" />
                      {employee.phone ?? "Sin teléfono"}
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="size-4" />
                      {employee.email ?? "Sin correo"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
