import { openUrl } from "@tauri-apps/plugin-opener";
import { create } from "zustand";

import type { Subscription } from "@/domain/entities/subscription";
import { SupabaseSubscriptionRepository } from "@/infrastructure/billing/supabase-subscription.repository";

interface SubscriptionStore {
  error: string | null;
  isLoading: boolean;
  isOpeningCheckout: boolean;
  load: (businessId: string) => Promise<void>;
  openCheckout: (businessId: string) => Promise<boolean>;
  subscription: Subscription | null;
}

const repository = new SupabaseSubscriptionRepository();

function billingErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim() !== ""
    ? error.message
    : "No fue posible conectar con Stripe.";
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  error: null,
  isLoading: false,
  isOpeningCheckout: false,
  subscription: null,

  load: async (businessId: string): Promise<void> => {
    set({ error: null, isLoading: true });
    try {
      const subscription = await repository.findByBusiness(businessId);
      set({ isLoading: false, subscription });
    } catch (error: unknown) {
      set({ error: billingErrorMessage(error), isLoading: false });
    }
  },

  openCheckout: async (businessId: string): Promise<boolean> => {
    set({ error: null, isOpeningCheckout: true });
    try {
      const url = await repository.createCheckout(businessId);
      if (url === null) {
        const subscription = await repository.findByBusiness(businessId);
        set({
          isOpeningCheckout: false,
          subscription,
        });
        return true;
      }
      await openUrl(url);
      set({ isOpeningCheckout: false });
      return true;
    } catch (error: unknown) {
      set({ error: billingErrorMessage(error), isOpeningCheckout: false });
      return false;
    }
  },
}));
