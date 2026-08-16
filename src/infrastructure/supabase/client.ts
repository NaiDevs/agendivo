import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseConfiguration {
  publishableKey: string;
  url: string;
}

let client: SupabaseClient | null = null;

function readConfiguration(): SupabaseConfiguration | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (
    url === undefined ||
    url === "" ||
    publishableKey === undefined ||
    publishableKey === ""
  ) {
    return null;
  }

  return { publishableKey, url };
}

export function isSupabaseConfigured(): boolean {
  return readConfiguration() !== null;
}

export function getSupabaseClient(): SupabaseClient {
  if (client !== null) {
    return client;
  }

  const configuration = readConfiguration();
  if (configuration === null) {
    throw new Error("Supabase no está configurado en este equipo.");
  }

  client = createClient(configuration.url, configuration.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
    },
  });

  return client;
}
