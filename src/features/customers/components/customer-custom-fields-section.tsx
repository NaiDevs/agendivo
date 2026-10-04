import { ListPlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUSTOMER_CUSTOM_FIELD_TYPE,
  type CustomerCustomField,
  type CustomerCustomFieldType,
} from "@/domain/entities/customer-custom-field";
import type { CustomerCustomFieldFormValues } from "@/schemas/customer-custom-field.schema";
import { useAppStore } from "@/stores/app.store";

const TYPE_LABELS: Record<CustomerCustomFieldType, string> = {
  text: "Texto",
  telephone: "Teléfono",
  number: "Número",
  boolean: "Sí / No",
  datetime: "Fecha y hora",
  email: "Correo",
  select: "Lista de opciones",
};

const EMPTY_VALUES: CustomerCustomFieldFormValues = {
  name: "",
  type: CUSTOMER_CUSTOM_FIELD_TYPE.TEXT,
  isRequired: false,
  isMultiple: false,
  options: [],
};

export function CustomerCustomFieldsSection() {
  const fields = useAppStore((state) => state.customerCustomFields);
  const addField = useAppStore((state) => state.addCustomerCustomField);
  const editField = useAppStore((state) => state.editCustomerCustomField);
  const removeField = useAppStore((state) => state.deleteCustomerCustomField);
  const isSaving = useAppStore((state) => state.isSaving);
  const [editing, setEditing] = useState<CustomerCustomField | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [values, setValues] =
    useState<CustomerCustomFieldFormValues>(EMPTY_VALUES);
  const [optionsText, setOptionsText] = useState("");

  const openNew = (): void => {
    setEditing(null);
    setValues(EMPTY_VALUES);
    setOptionsText("");
    setIsFormOpen(true);
  };

  const openEdit = (field: CustomerCustomField): void => {
    setEditing(field);
    setValues({
      name: field.name,
      type: field.type,
      isRequired: field.isRequired,
      isMultiple: field.isMultiple,
      options: field.options,
    });
    setOptionsText(field.options.join("\n"));
    setIsFormOpen(true);
  };

  const closeForm = (): void => {
    setEditing(null);
    setIsFormOpen(false);
  };

  const save = async (): Promise<void> => {
    const payload: CustomerCustomFieldFormValues = {
      ...values,
      options:
        values.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT
          ? optionsText
              .split("\n")
              .map((option) => option.trim())
              .filter((option) => option !== "")
          : [],
      isMultiple:
        values.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT && values.isMultiple,
    };
    const saved =
      editing === null
        ? await addField(payload)
        : await editField(editing.id, payload);
    if (saved) closeForm();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
              <ListPlus className="size-5" />
            </div>
            <CardTitle>Campos personalizados</CardTitle>
            <CardDescription>
              Agrega información propia de tu negocio al perfil de cada cliente.
            </CardDescription>
          </div>
          <Button
            onClick={isFormOpen ? closeForm : openNew}
            type="button"
            variant="outline"
          >
            {isFormOpen ? <X /> : <Plus />}
            {isFormOpen ? "Cerrar" : "Nuevo campo"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {isFormOpen && (
          <div className="bg-muted/40 grid gap-4 rounded-xl border p-4">
            <div className="grid gap-2">
              <Label htmlFor="custom-field-name">Nombre del campo</Label>
              <Input
                id="custom-field-name"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ej. Alergias, cumpleaños, sede"
                value={values.name}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="custom-field-type">Tipo</Label>
                <select
                  className="border-input min-h-10 rounded-lg border bg-white px-3 text-sm"
                  id="custom-field-type"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      type: event.target.value as CustomerCustomFieldType,
                      isMultiple: false,
                    }))
                  }
                  value={values.type}
                >
                  {Object.entries(TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-end gap-4 pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={values.isRequired}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        isRequired: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Obligatorio
                </label>
                {values.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      checked={values.isMultiple}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          isMultiple: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Selección múltiple
                  </label>
                )}
              </div>
            </div>
            {values.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT && (
              <div className="grid gap-2">
                <Label htmlFor="custom-field-options">Opciones</Label>
                <textarea
                  className="border-input min-h-28 rounded-lg border bg-white px-3 py-2 text-sm"
                  id="custom-field-options"
                  onChange={(event) => setOptionsText(event.target.value)}
                  placeholder={"Una opción por línea\nOpción 1\nOpción 2"}
                  value={optionsText}
                />
              </div>
            )}
            <Button
              disabled={isSaving}
              onClick={() => void save()}
              type="button"
            >
              {isSaving
                ? "Guardando…"
                : editing === null
                  ? "Crear campo"
                  : "Guardar cambios"}
            </Button>
          </div>
        )}

        {fields.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Todavía no has creado campos personalizados.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <article
                className="flex min-h-24 items-start gap-3 rounded-xl border p-4"
                key={field.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{field.name}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {TYPE_LABELS[field.type]}
                    {field.isRequired ? " · Obligatorio" : " · Opcional"}
                  </p>
                </div>
                <Button
                  aria-label={`Editar ${field.name}`}
                  onClick={() => openEdit(field)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <Pencil />
                </Button>
                <Button
                  aria-label={`Eliminar ${field.name}`}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el campo “${field.name}”?`)) {
                      void removeField(field.id);
                    }
                  }}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                </Button>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
