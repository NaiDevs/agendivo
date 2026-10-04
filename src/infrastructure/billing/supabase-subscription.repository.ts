import { z } from "zod";

import {
  SUBSCRIPTION_STATUS,
  type Subscription,
} from "@/domain/entities/subscription";
import type { SubscriptionRepository } from "@/domain/repositories/subscription.repository";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

const subscriptionRowSchema = z.object({
  business_id: z.string().uuid(),
  stripe_price_id: z.string(),
  status: z.enum([
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.CANCELED,
    SUBSCRIPTION_STATUS.CHECKOUT_PENDING,
    SUBSCRIPTION_STATUS.INCOMPLETE,
    SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED,
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.PAUSED,
    SUBSCRIPTION_STATUS.TRIALING,
    SUBSCRIPTION_STATUS.UNPAID,
  ]),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
});

const checkoutResponseSchema = z.object({
  active: z.boolean(),
  url: z.url().nullable(),
});

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async ensureBusiness(
    businessId: string,
    businessName: string,
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();
    if (error !== null) {
      throw error;
    }
    if (data !== null) {
      return;
    }

    const { error: createError } = await supabase.rpc("create_business", {
      business_id: businessId,
      business_name: businessName,
    });
    if (createError !== null) {
      throw createError;
    }
  }

  async findByBusiness(businessId: string): Promise<Subscription | null> {
    const supabase = getSupabaseClient();
    const { error: syncError } = await supabase.functions.invoke(
      "sync-subscription",
      { body: { businessId } },
    );
    if (syncError !== null) {
      throw syncError;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "business_id, stripe_price_id, status, current_period_end, cancel_at_period_end",
      )
      .eq("business_id", businessId)
      .maybeSingle();
    if (error !== null) {
      throw error;
    }
    if (data === null) {
      return null;
    }

    const row = subscriptionRowSchema.parse(data);
    return {
      businessId: row.business_id,
      stripePriceId: row.stripe_price_id,
      status: row.status,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
    };
  }

  async createCheckout(businessId: string): Promise<string | null> {
    const { data, error } = await getSupabaseClient().functions.invoke(
      "create-checkout-session",
      { body: { businessId } },
    );
    if (error !== null) {
      throw error;
    }
    return checkoutResponseSchema.parse(data).url;
  }
}
