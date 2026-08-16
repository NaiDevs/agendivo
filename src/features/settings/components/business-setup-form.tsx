import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  FileCheck2,
  MapPin,
  ReceiptText,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  businessOnboardingSchema,
  type BusinessOnboardingValues,
} from "@/schemas/fiscal.schema";
import { useAppStore } from "@/stores/app.store";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Negocio", description: "Datos de contacto", icon: Building2 },
  { title: "Fiscal", description: "Identidad tributaria", icon: ReceiptText },
  { title: "Correlativo", description: "CAI y rango", icon: MapPin },
  { title: "Confirmar", description: "Revisar y crear", icon: FileCheck2 },
] as const;

const STEP_FIELDS: FieldPath<BusinessOnboardingValues>[][] = [
  ["name", "phone", "email", "address", "timezone", "currency"],
  ["countryCode", "legalName", "taxId", "invoicesEnabled"],
  [
    "establishmentName",
    "establishmentCode",
    "emissionPointName",
    "emissionPointCode",
    "cai",
    "validUntil",
    "rangeStart",
    "rangeEnd",
    "nextNumber",
  ],
  [],
];

export function BusinessSetupForm() {
  const [step, setStep] = useState(0);
  const completeOnboarding = useAppStore(
    (state) => state.completeBusinessOnboarding,
  );
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    trigger,
    control,
    getValues,
    formState: { errors },
  } = useForm<BusinessOnboardingValues>({
    resolver: zodResolver(businessOnboardingSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      timezone: "America/Tegucigalpa",
      currency: "HNL",
      countryCode: "HN",
      legalName: "",
      taxId: "",
      invoicesEnabled: false,
      establishmentName: "Principal",
      establishmentCode: "001",
      emissionPointName: "Caja principal",
      emissionPointCode: "001",
      cai: "",
      validUntil: "",
      rangeStart: 1,
      rangeEnd: 100,
      nextNumber: 1,
    },
  });
  const invoicesEnabled = useWatch({ control, name: "invoicesEnabled" });

  const nextStep = async (): Promise<void> => {
    clearError();
    const valid = await trigger(STEP_FIELDS[step] ?? []);
    if (valid) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  };

  const onSubmit = handleSubmit(async (input): Promise<void> => {
    clearError();
    await completeOnboarding(input);
  });

  return (
    <Card className="w-full max-w-4xl overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle>Configura Agendivo</CardTitle>
        <CardDescription>
          Completa los datos iniciales. Podrás modificarlos después.
        </CardDescription>
        <StepIndicator currentStep={step} />
      </CardHeader>
      <CardContent className="pt-6">
        <form className="grid gap-6" onSubmit={onSubmit}>
          {error !== null && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos crear el negocio</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 0 && <BusinessStep errors={errors} register={register} />}
          {step === 1 && <FiscalStep errors={errors} register={register} />}
          {step === 2 && (
            <CorrelativeStep
              enabled={invoicesEnabled}
              errors={errors}
              register={register}
            />
          )}
          {step === 3 && <Summary values={getValues()} />}

          <div className="flex items-center justify-between border-t pt-5">
            <Button
              disabled={step === 0 || isSaving}
              type="button"
              variant="outline"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
            >
              Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => void nextStep()}>
                Continuar
              </Button>
            ) : (
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Creando…" : "Crear mi negocio"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type FormErrors = ReturnType<
  typeof useForm<BusinessOnboardingValues>
>["formState"]["errors"];
type FormRegister = ReturnType<
  typeof useForm<BusinessOnboardingValues>
>["register"];

function BusinessStep({
  errors,
  register,
}: {
  errors: FormErrors;
  register: FormRegister;
}) {
  return (
    <section className="grid gap-5">
      <SectionHeading
        title="Información del negocio"
        description="Estos datos aparecerán en tu operación diaria."
      />
      <FormField
        error={errors.name?.message}
        label="Nombre comercial"
        name="name"
      >
        <Input
          autoFocus
          id="name"
          placeholder="Salón Bella"
          {...register("name")}
        />
      </FormField>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField error={errors.phone?.message} label="Teléfono" name="phone">
          <Input id="phone" placeholder="9999-9999" {...register("phone")} />
        </FormField>
        <FormField
          error={errors.email?.message}
          label="Correo del negocio"
          name="email"
        >
          <Input
            id="email"
            type="email"
            placeholder="negocio@ejemplo.com"
            {...register("email")}
          />
        </FormField>
      </div>
      <FormField
        error={errors.address?.message}
        label="Dirección"
        name="address"
      >
        <Input id="address" {...register("address")} />
      </FormField>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.timezone?.message}
          label="Zona horaria"
          name="timezone"
        >
          <Input id="timezone" {...register("timezone")} />
        </FormField>
        <FormField
          error={errors.currency?.message}
          label="Moneda"
          name="currency"
        >
          <Input id="currency" maxLength={3} {...register("currency")} />
        </FormField>
      </div>
    </section>
  );
}

function FiscalStep({
  errors,
  register,
}: {
  errors: FormErrors;
  register: FormRegister;
}) {
  return (
    <section className="grid gap-5">
      <SectionHeading
        title="Información fiscal"
        description="La razón social y el RTN identifican legalmente al negocio."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.legalName?.message}
          label="Razón social o nombre legal"
          name="legalName"
        >
          <Input autoFocus id="legalName" {...register("legalName")} />
        </FormField>
        <FormField error={errors.taxId?.message} label="RTN" name="taxId">
          <Input id="taxId" placeholder="0801…" {...register("taxId")} />
        </FormField>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.countryCode?.message}
          label="País"
          name="countryCode"
        >
          <select
            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            id="countryCode"
            {...register("countryCode")}
          >
            <option value="HN">Honduras</option>
            <option value="GT">Guatemala</option>
          </select>
        </FormField>
        <FormField
          error={errors.invoicesEnabled?.message}
          label="Facturación fiscal"
          name="invoicesEnabled"
        >
          <select
            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            id="invoicesEnabled"
            {...register("invoicesEnabled", {
              setValueAs: (value: string) => value === "true",
            })}
          >
            <option value="false">La configuraré después</option>
            <option value="true">Sí, ya tengo CAI y rango autorizado</option>
          </select>
        </FormField>
      </div>
      <Alert>
        <AlertTitle>Puedes continuar sin autorización</AlertTitle>
        <AlertDescription>
          Agendivo dejará la facturación fiscal inactiva hasta que exista un CAI
          y un rango autorizado.
        </AlertDescription>
      </Alert>
    </section>
  );
}

function CorrelativeStep({
  enabled,
  errors,
  register,
}: {
  enabled: boolean;
  errors: FormErrors;
  register: FormRegister;
}) {
  if (!enabled) {
    return (
      <section className="grid min-h-64 place-items-center text-center">
        <div className="max-w-md">
          <div className="bg-muted mx-auto grid size-14 place-items-center rounded-2xl">
            <ReceiptText className="text-muted-foreground size-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">
            Configuración fiscal pendiente
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Agendivo guardará el negocio sin correlativos. No se podrán emitir
            facturas fiscales hasta completar esta sección.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <SectionHeading
        title="Punto de emisión y correlativo"
        description="Usa exactamente los códigos y el rango de tu autorización fiscal."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.establishmentName?.message}
          label="Establecimiento"
          name="establishmentName"
        >
          <Input id="establishmentName" {...register("establishmentName")} />
        </FormField>
        <FormField
          error={errors.establishmentCode?.message}
          label="Código de establecimiento"
          name="establishmentCode"
        >
          <Input
            id="establishmentCode"
            inputMode="numeric"
            maxLength={3}
            {...register("establishmentCode")}
          />
        </FormField>
        <FormField
          error={errors.emissionPointName?.message}
          label="Punto de emisión"
          name="emissionPointName"
        >
          <Input id="emissionPointName" {...register("emissionPointName")} />
        </FormField>
        <FormField
          error={errors.emissionPointCode?.message}
          label="Código del punto"
          name="emissionPointCode"
        >
          <Input
            id="emissionPointCode"
            inputMode="numeric"
            maxLength={3}
            {...register("emissionPointCode")}
          />
        </FormField>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField error={errors.cai?.message} label="CAI" name="cai">
          <Input id="cai" placeholder="XXXXXX-XXXXXX-…" {...register("cai")} />
        </FormField>
        <FormField
          error={errors.validUntil?.message}
          label="Fecha límite de emisión"
          name="validUntil"
        >
          <Input id="validUntil" type="date" {...register("validUntil")} />
        </FormField>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <FormField
          error={errors.rangeStart?.message}
          label="Número inicial"
          name="rangeStart"
        >
          <Input
            id="rangeStart"
            min={0}
            type="number"
            {...register("rangeStart")}
          />
        </FormField>
        <FormField
          error={errors.rangeEnd?.message}
          label="Número final"
          name="rangeEnd"
        >
          <Input
            id="rangeEnd"
            min={0}
            type="number"
            {...register("rangeEnd")}
          />
        </FormField>
        <FormField
          error={errors.nextNumber?.message}
          label="Comenzar desde"
          name="nextNumber"
        >
          <Input
            id="nextNumber"
            min={0}
            type="number"
            {...register("nextNumber")}
          />
        </FormField>
      </div>
    </section>
  );
}

function Summary({ values }: { values: BusinessOnboardingValues }) {
  const items = [
    ["Negocio", values.name],
    ["Razón social", values.legalName],
    ["RTN", values.taxId || "No indicado"],
    [
      "Facturación fiscal",
      values.invoicesEnabled ? "Configurada" : "Pendiente",
    ],
    ...(values.invoicesEnabled
      ? [
          [
            "Punto de emisión",
            `${values.establishmentCode}-${values.emissionPointCode}`,
          ],
          ["Rango autorizado", `${values.rangeStart} a ${values.rangeEnd}`],
          ["Próximo correlativo", String(values.nextNumber)],
        ]
      : []),
  ];
  return (
    <section className="grid gap-5">
      <SectionHeading
        title="Confirma la configuración"
        description="Revisa los datos antes de crear el negocio."
      />
      <div className="divide-y rounded-xl border">
        {items.map(([label, value]) => (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-2" key={label}>
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="text-sm font-medium sm:text-right">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mt-5 grid grid-cols-4 gap-2">
      {STEPS.map((item, index) => {
        const Icon = item.icon;
        const completed = index < currentStep;
        const active = index === currentStep;
        return (
          <li
            className={cn(
              "rounded-xl border p-2 transition-colors sm:p-3",
              active && "border-primary bg-primary/5",
              completed && "border-emerald-500/30 bg-emerald-500/5",
            )}
            key={item.title}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "bg-muted grid size-7 shrink-0 place-items-center rounded-lg",
                  active && "bg-primary text-primary-foreground",
                  completed && "bg-emerald-600 text-white",
                )}
              >
                {completed ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-semibold">{item.title}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

interface FormFieldProps {
  children: ReactNode;
  error: string | undefined;
  label: string;
  name: string;
}
function FormField({ children, error, label, name }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error !== undefined && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
