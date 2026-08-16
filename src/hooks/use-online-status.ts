import { useSyncExternalStore } from "react";

function subscribe(onStatusChange: () => void): () => void {
  window.addEventListener("online", onStatusChange);
  window.addEventListener("offline", onStatusChange);

  return (): void => {
    window.removeEventListener("online", onStatusChange);
    window.removeEventListener("offline", onStatusChange);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, (): boolean => true);
}
