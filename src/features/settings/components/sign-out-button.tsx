import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AUTH_PHASE, useAuthStore } from "@/stores/auth.store";

export function SignOutButton() {
  const phase = useAuthStore((state) => state.phase);
  const isWorking = useAuthStore((state) => state.isWorking);
  const signOut = useAuthStore((state) => state.signOut);

  if (phase !== AUTH_PHASE.AUTHENTICATED) return null;

  return (
    <Button
      className="min-h-11 w-full sm:w-auto"
      disabled={isWorking}
      onClick={() => void signOut()}
      type="button"
      variant="outline"
    >
      <LogOut className="size-4" />
      {isWorking ? "Cerrando…" : "Cerrar sesión"}
    </Button>
  );
}
