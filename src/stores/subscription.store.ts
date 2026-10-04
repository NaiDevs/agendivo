import { openUrl } from "@tauri-apps/plugin-opener";
import { create } from "zustand";

import type { Subscription } from "@/domain/entities/subscription";
import { validateStripeCheckoutUrl } from "@/infrastructure/billing/checkout-url";
import { SupabaseSubscriptionRepository } from "@/infrastructure/billing/supabase-subscription.repository";

interface SubscriptionStore {
  checkedBusinessId: string | null;
  error: string | null;
  isLoading: boolean;
  isOpeningCheckout: boolean;
  load: (businessId: string, businessName: string) => Promise<void>;
  openCheckout: (businessId: string, businessName: string) => Promise<boolean>;
  reset: () => void;
  subscription: Subscription | null;
}

const repository = new SupabaseSubscriptionRepository();

function billingErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim() !== ""
    ? error.message
    : "No fue posible conectar con Stripe.";
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  checkedBusinessId: null,
  error: null,
  isLoading: false,
  isOpeningCheckout: false,
  subscription: null,

  load: async (businessId: string, businessName: string): Promise<void> => {
    set((state) => ({
      checkedBusinessId:
        state.checkedBusinessId === businessId ? state.checkedBusinessId : null,
      error: null,
      isLoading: true,
      subscription:
        state.checkedBusinessId === businessId ? state.subscription : null,
    }));
    try {
      await repository.ensureBusiness(businessId, businessName);
      const subscription = await repository.findByBusiness(businessId);
      set({ checkedBusinessId: businessId, isLoading: false, subscription });
    } catch (error: unknown) {
      set({
        checkedBusinessId: businessId,
        error: billingErrorMessage(error),
        isLoading: false,
        subscription: null,
      });
    }
  },

  openCheckout: async (
    businessId: string,
    businessName: string,
  ): Promise<boolean> => {
    set({ error: null, isOpeningCheckout: true });
    try {
      await repository.ensureBusiness(businessId, businessName);
      const url = await repository.createCheckout(businessId);
      if (url === null) {
        const subscription = await repository.findByBusiness(businessId);
        set({
          checkedBusinessId: businessId,
          isOpeningCheckout: false,
          subscription,
        });
        return true;
      }
      await openUrl(validateStripeCheckoutUrl(url));
      set({ isOpeningCheckout: false });
      return true;
    } catch (error: unknown) {
      set({ error: billingErrorMessage(error), isOpeningCheckout: false });
      return false;
    }
  },

  reset: (): void =>
    set({
      checkedBusinessId: null,
      error: null,
      isLoading: false,
      isOpeningCheckout: false,
      subscription: null,
    }),
}));
