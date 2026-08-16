import { LogOut, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_PHASE, useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";

export function AccountCard() {
  const phase = useAuthStore((state) => state.phase);
  const user = useAuthStore((state) => state.user);
  const isWorking = useAuthStore((state) => state.isWorking);
  const signOut = useAuthStore((state) => state.signOut);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");

  if (phase !== AUTH_PHASE.AUTHENTICATED || user === null) {
    return null;
  }

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <UserRound className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">Cuenta</h2>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-xl border bg-white p-4">
        <ShieldCheck className="size-5 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.fullName}</p>
          <p className="text-muted-foreground text-sm">
            Sesión protegida por Supabase
          </p>
        </div>
        <Button
          aria-label="Editar perfil de cuenta"
          onClick={() => {
            setFullName(user.fullName);
            setEditing(true);
          }}
          size="icon"
          type="button"
          variant="outline"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
      {editing && (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void (async (): Promise<void> => {
              if (await updateProfile(fullName)) setEditing(false);
            })();
          }}
        >
          <Input
            aria-label="Nombre del perfil"
            onChange={(event) => setFullName(event.target.value)}
            value={fullName}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setEditing(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={isWorking || fullName.trim().length < 2}
              type="submit"
            >
              Guardar
            </Button>
          </div>
        </form>
      )}
      <Button
        className="mt-4 w-full"
        disabled={isWorking}
        onClick={() => void signOut()}
        type="button"
        variant="outline"
      >
        <LogOut />
        {isWorking ? "Cerrando…" : "Cerrar sesión"}
      </Button>
    </div>
  );
}
