import { create } from "zustand";

export const TOAST_KIND = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
} as const;

export type ToastKind = (typeof TOAST_KIND)[keyof typeof TOAST_KIND];

export interface ToastInput {
  kind: ToastKind;
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastMessage extends ToastInput {
  id: string;
}

interface LoadingOperation {
  id: string;
  message: string;
}

interface FeedbackStore {
  toasts: ToastMessage[];
  loadingOperations: LoadingOperation[];
  addToast: (toast: ToastInput) => string;
  removeToast: (toastId: string) => void;
  startLoading: (message: string) => string;
  stopLoading: (operationId: string) => void;
}

let nextFeedbackId = 0;

function createFeedbackId(prefix: string): string {
  nextFeedbackId += 1;
  return `${prefix}-${Date.now()}-${nextFeedbackId}`;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  toasts: [],
  loadingOperations: [],

  addToast: (toast: ToastInput): string => {
    const id = createFeedbackId("toast");
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },

  removeToast: (toastId: string): void => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }));
  },

  startLoading: (message: string): string => {
    const id = createFeedbackId("loading");
    set((state) => ({
      loadingOperations: [...state.loadingOperations, { id, message }],
    }));
    return id;
  },

  stopLoading: (operationId: string): void => {
    set((state) => ({
      loadingOperations: state.loadingOperations.filter(
        (operation) => operation.id !== operationId,
      ),
    }));
  },
}));

function showToast(
  kind: ToastKind,
  title: string,
  description?: string,
): string {
  return useFeedbackStore.getState().addToast({
    kind,
    title,
    description,
  });
}

export const toastService = {
  success: (title: string, description?: string): string =>
    showToast(TOAST_KIND.SUCCESS, title, description),
  error: (title: string, description?: string): string =>
    showToast(TOAST_KIND.ERROR, title, description),
  info: (title: string, description?: string): string =>
    showToast(TOAST_KIND.INFO, title, description),
  dismiss: (toastId: string): void =>
    useFeedbackStore.getState().removeToast(toastId),
};

export const loadingService = {
  start: (message = "Procesando…"): string =>
    useFeedbackStore.getState().startLoading(message),
  stop: (operationId: string): void =>
    useFeedbackStore.getState().stopLoading(operationId),
  run: async <T>(operation: () => Promise<T>, message?: string): Promise<T> => {
    const operationId = loadingService.start(message);
    try {
      return await operation();
    } finally {
      loadingService.stop(operationId);
    }
  },
};
