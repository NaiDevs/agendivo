import { zodResolver } from "@hookform/resolvers/zod";
import { Cloud, LockKeyhole, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmSignUpSchema,
  configurePasswordSchema,
  registerAccountSchema,
  signInSchema,
  type ConfirmSignUpValues,
  type ConfigurePasswordValues,
  type RegisterAccountValues,
  type SignInValues,
} from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

const AUTH_MODE = {
  CONFIRM: "confirm",
  REGISTER: "register",
  SIGN_IN: "sign-in",
} as const;

type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>(AUTH_MODE.SIGN_IN);
  const error = useAuthStore((state) => state.error);
  const notice = useAuthStore((state) => state.notice);
  const confirmationEmail = useAuthStore((state) => state.confirmationEmail);
  const mustConfigurePassword = useAuthStore(
    (state) => state.mustConfigurePassword,
  );
  const cancelEmailConfirmation = useAuthStore(
    (state) => state.cancelEmailConfirmation,
  );
  const clearFeedback = useAuthStore((state) => state.clearFeedback);

  const changeMode = (nextMode: AuthMode): void => {
    cancelEmailConfirmation();
    clearFeedback();
    setMode(nextMode);
  };

  const confirmingEmail =
    confirmationEmail !== null || mode === AUTH_MODE.CONFIRM;

  return (
    <main className="setup-background grid min-h-screen place-items-center p-4 sm:p-8">
      <div className="page-enter grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-sidebar hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="bg-primary flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">
              Agendivo
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Tu negocio disponible donde lo necesites.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              Inicia sesión para proteger tu información y preparar la
              sincronización entre dispositivos.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/65">
            <Feature icon={LockKeyhole} text="Acceso protegido por cuenta" />
            <Feature
              icon={Cloud}
              text="Preparado para sincronización en la nube"
            />
          </div>
        </section>

        <Card className="rounded-none border-0 p-3 shadow-none sm:p-8">
          <CardHeader>
            <CardTitle>
              {mustConfigurePassword
                ? "Configura tu contraseña"
                : confirmingEmail
                  ? "Confirmar correo"
                  : mode === AUTH_MODE.SIGN_IN
                    ? "Iniciar sesión"
                    : "Crear cuenta"}
            </CardTitle>
            <CardDescription>
              {mustConfigurePassword
                ? "Crea la contraseña con la que ingresarás a tu cuenta de equipo."
                : confirmingEmail
                  ? `Ingresa el código enviado a ${confirmationEmail}.`
                  : mode === AUTH_MODE.SIGN_IN
                    ? "Ingresa con la cuenta asociada a tu negocio."
                    : "Crea la cuenta propietaria de tu negocio."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {error !== null && (
              <Alert variant="destructive">
                <AlertTitle>No pudimos continuar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {notice !== null && (
              <Alert>
                <AlertTitle>Confirma tu cuenta</AlertTitle>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            {mustConfigurePassword ? (
              <ConfigureInvitationPasswordForm />
            ) : confirmingEmail ? (
              <ConfirmSignUpForm email={confirmationEmail ?? ""} />
            ) : mode === AUTH_MODE.SIGN_IN ? (
              <SignInForm />
            ) : (
              <RegisterForm />
            )}

            {!mustConfigurePassword && (
              <div className="flex items-center justify-center gap-1 text-sm">
                <span className="text-muted-foreground">
                  {confirmingEmail
                    ? "¿Deseas usar otra cuenta?"
                    : mode === AUTH_MODE.SIGN_IN
                      ? "¿No tienes cuenta?"
                      : "¿Ya tienes cuenta?"}
                </span>
                <Button
                  variant="link"
                  type="button"
                  onClick={() =>
                    changeMode(
                      confirmingEmail
                        ? AUTH_MODE.SIGN_IN
                        : mode === AUTH_MODE.SIGN_IN
                          ? AUTH_MODE.REGISTER
                          : AUTH_MODE.SIGN_IN,
                    )
                  }
                >
                  {confirmingEmail
                    ? "Inicia sesión"
                    : mode === AUTH_MODE.SIGN_IN
                      ? "Regístrate"
                      : "Inicia sesión"}
                </Button>
              </div>
            )}
            {!confirmingEmail && mode === AUTH_MODE.SIGN_IN && (
              <Button
                onClick={() => changeMode(AUTH_MODE.CONFIRM)}
                type="button"
                variant="ghost"
              >
                Tengo un código de confirmación
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ConfigureInvitationPasswordForm() {
  const configurePassword = useAuthStore(
    (state) => state.configureInvitationPassword,
  );
  const isWorking = useAuthStore((state) => state.isWorking);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ConfigurePasswordValues>({
    resolver: zodResolver(configurePasswordSchema),
    defaultValues: { confirmPassword: "", password: "" },
  });
  const onSubmit = handleSubmit(async (values): Promise<void> => {
    await configurePassword(values.password);
  });
  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <AuthField
        error={errors.password?.message}
        label="Nueva contraseña"
        name="invitation-password"
      >
        <Input
          autoComplete="new-password"
          autoFocus
          id="invitation-password"
          type="password"
          {...register("password")}
        />
      </AuthField>
      <AuthField
        error={errors.confirmPassword?.message}
        label="Confirmar contraseña"
        name="invitation-password-confirmation"
      >
        <Input
          autoComplete="new-password"
          id="invitation-password-confirmation"
          type="password"
          {...register("confirmPassword")}
        />
      </AuthField>
      <Button className="h-11" disabled={isWorking} type="submit">
        {isWorking ? "Configurando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}

function ConfirmSignUpForm({ email }: { email: string }) {
  const confirmSignUp = useAuthStore((state) => state.confirmSignUp);
  const resendSignUpConfirmation = useAuthStore(
    (state) => state.resendSignUpConfirmation,
  );
  const isWorking = useAuthStore((state) => state.isWorking);
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    trigger,
  } = useForm<ConfirmSignUpValues>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: { email, token: "" },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    await confirmSignUp(values);
  });

  const resendCode = async (): Promise<void> => {
    if (!(await trigger("email"))) return;
    await resendSignUpConfirmation(getValues("email"));
  };

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <AuthField
        error={errors.email?.message}
        label="Correo"
        name="confirmation-email"
      >
        <Input
          autoComplete="email"
          id="confirmation-email"
          type="email"
          {...register("email")}
        />
      </AuthField>
      <AuthField
        error={errors.token?.message}
        label="Código de confirmación"
        name="confirmation-token"
      >
        <Input
          autoComplete="one-time-code"
          autoFocus={email !== ""}
          id="confirmation-token"
          inputMode="numeric"
          maxLength={8}
          placeholder="123456"
          {...register("token")}
        />
      </AuthField>
      <Button className="h-11" disabled={isWorking} type="submit">
        {isWorking ? "Confirmando…" : "Confirmar correo"}
      </Button>
      <Button
        disabled={isWorking}
        onClick={() => void resendCode()}
        type="button"
        variant="outline"
      >
        Reenviar código
      </Button>
    </form>
  );
}

function SignInForm() {
  const signIn = useAuthStore((state) => state.signIn);
  const isWorking = useAuthStore((state) => state.isWorking);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    await signIn(values);
  });

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <AuthField
        error={errors.email?.message}
        label="Correo"
        name="sign-in-email"
      >
        <Input
          autoComplete="email"
          autoFocus
          id="sign-in-email"
          type="email"
          {...register("email")}
        />
      </AuthField>
      <AuthField
        error={errors.password?.message}
        label="Contraseña"
        name="sign-in-password"
      >
        <Input
          autoComplete="current-password"
          id="sign-in-password"
          type="password"
          {...register("password")}
        />
      </AuthField>
      <Button className="h-11" disabled={isWorking} type="submit">
        {isWorking ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const createAccount = useAuthStore((state) => state.register);
  const isWorking = useAuthStore((state) => state.isWorking);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterAccountValues>({
    resolver: zodResolver(registerAccountSchema),
    defaultValues: {
      confirmPassword: "",
      email: "",
      fullName: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    await createAccount({
      email: values.email,
      fullName: values.fullName,
      password: values.password,
    });
  });

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <AuthField
        error={errors.fullName?.message}
        label="Nombre completo"
        name="full-name"
      >
        <Input
          autoComplete="name"
          autoFocus
          id="full-name"
          {...register("fullName")}
        />
      </AuthField>
      <AuthField
        error={errors.email?.message}
        label="Correo"
        name="register-email"
      >
        <Input
          autoComplete="email"
          id="register-email"
          type="email"
          {...register("email")}
        />
      </AuthField>
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          error={errors.password?.message}
          label="Contraseña"
          name="register-password"
        >
          <Input
            autoComplete="new-password"
            id="register-password"
            type="password"
            {...register("password")}
          />
        </AuthField>
        <AuthField
          error={errors.confirmPassword?.message}
          label="Confirmar contraseña"
          name="confirm-password"
        >
          <Input
            autoComplete="new-password"
            id="confirm-password"
            type="password"
            {...register("confirmPassword")}
          />
        </AuthField>
      </div>
      <Button className="h-11" disabled={isWorking} type="submit">
        {isWorking ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}

interface AuthFieldProps {
  children: ReactNode;
  error: string | undefined;
  label: string;
  name: string;
}

function AuthField({ children, error, label, name }: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Cloud; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-white/8">
        <Icon className="size-4" />
      </div>
      <span>{text}</span>
    </div>
  );
}
