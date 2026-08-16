# Diseño — Sincronización y suscripciones (Fase 6, entregas 2 y 3)

Estado: implementado; Stripe pendiente de secretos de prueba

## Sincronización

SQLite continúa siendo la base operativa. Después de iniciar sesión, la
aplicación crea o enlaza el tenant remoto y envía clientes, profesionales,
servicios y citas mediante `sync_push`.

La función compara `version` y `updated_at`. Un dispositivo con datos anteriores
no puede reemplazar una versión más nueva. Las referencias de citas se validan
con claves foráneas por negocio y PostgreSQL impide traslapes de agenda para el
mismo profesional.

Esta entrega implementa el envío seguro a la nube. La descarga y resolución
interactiva de conflictos entre dos dispositivos queda para la siguiente
entrega.

## Stripe Checkout

La función `create-checkout-session`:

- exige un JWT válido de Supabase;
- comprueba que el usuario sea propietario o administrador del negocio;
- utiliza el Price ID almacenado como secreto de Supabase;
- crea Stripe Checkout en modo suscripción;
- nunca recibe ni expone claves secretas en Tauri.

El webhook `stripe-webhook` valida `stripe-signature`, procesa cada evento una
sola vez y actualiza `subscriptions` a partir de eventos
`customer.subscription.created`, `customer.subscription.updated` y
`customer.subscription.deleted`.

## Configuración pendiente en Stripe

Endpoint:

```text
https://cccntuyiekdajmgfrfsx.supabase.co/functions/v1/stripe-webhook
```

Eventos:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Secretos que deben configurarse directamente desde una terminal autenticada:

```cmd
supabase secrets set STRIPE_SECRET_KEY=sk_test_REEMPLAZAR --project-ref cccntuyiekdajmgfrfsx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_REEMPLAZAR --project-ref cccntuyiekdajmgfrfsx
```

No se deben copiar estas claves al repositorio, a `.env.local` ni al frontend.
