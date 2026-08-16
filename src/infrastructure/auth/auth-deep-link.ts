import { isTauri } from "@tauri-apps/api/core";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";

import { toastService } from "@/stores/feedback.store";
import { useAuthStore } from "@/stores/auth.store";

export interface AuthCallback {
  accessToken: string | null;
  code: string | null;
  error: string | null;
  isInvitation: boolean;
  refreshToken: string | null;
}

export function parseAuthCallback(value: string): AuthCallback | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== "agendivo:" ||
    url.hostname !== "auth" ||
    !["/callback", "/invite"].includes(url.pathname)
  ) {
    return null;
  }

  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  return {
    accessToken: fragment.get("access_token"),
    code: url.searchParams.get("code"),
    error:
      url.searchParams.get("error_description") ??
      fragment.get("error_description"),
    isInvitation:
      url.pathname === "/invite" ||
      url.searchParams.get("type") === "invite" ||
      fragment.get("type") === "invite",
    refreshToken: fragment.get("refresh_token"),
  };
}

async function processUrls(urls: string[]): Promise<void> {
  for (const value of urls) {
    const callback = parseAuthCallback(value);
    if (callback === null) {
      continue;
    }

    if (callback.error !== null) {
      toastService.error("No pudimos confirmar tu correo", callback.error);
      continue;
    }

    if (callback.accessToken !== null && callback.refreshToken !== null) {
      await useAuthStore
        .getState()
        .completeInvitation(callback.accessToken, callback.refreshToken);
      continue;
    }

    if (callback.code === null || callback.code.trim() === "") {
      toastService.error(
        "Enlace de confirmación inválido",
        "Solicita un correo nuevo desde Agendivo.",
      );
      continue;
    }

    if (callback.isInvitation) {
      await useAuthStore.getState().completeInvitationCode(callback.code);
    } else {
      await useAuthStore.getState().completeEmailConfirmation(callback.code);
    }
  }
}

export async function initializeAuthDeepLinks(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await onOpenUrl((urls): void => {
    void processUrls(urls);
  });

  const currentUrls = await getCurrent();
  if (currentUrls !== null) {
    await processUrls(currentUrls);
  }
}
