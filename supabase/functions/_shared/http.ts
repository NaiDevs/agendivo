const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:1420",
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
];

function allowedOrigins(): string[] {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  return configured === undefined
    ? DEFAULT_ALLOWED_ORIGINS
    : configured.split(",").map((origin) => origin.trim());
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (origin !== null && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export function jsonResponse(
  request: Request,
  status: number,
  payload: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}
