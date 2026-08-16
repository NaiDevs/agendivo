# Diseño — Autenticación y base multi-negocio (Fase 6, entrega 1)

Estado: implementado, pendiente de conectar a un proyecto Supabase

## Objetivo

Agregar identidad remota sin eliminar la operación local de Agendivo. SQLite
continúa siendo la base de trabajo del dispositivo; Supabase administra cuentas,
negocios, membresías y dispositivos autorizados.

## Flujo

1. La aplicación detecta si existen `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Con Supabase configurado, exige registro o inicio de sesión antes de abrir la
   base local.
3. La primera cuenta autenticada queda vinculada al dispositivo en
   `device_metadata.auth_user_id`.
4. Una cuenta distinta no puede abrir esa misma base SQLite.
5. Sin variables de Supabase, la versión `0.1.0` conserva su funcionamiento
   local para facilitar la transición.

## Modelo remoto

- `profiles`: perfil público mínimo asociado a `auth.users`.
- `businesses`: tenant del negocio; conserva el UUID local.
- `business_members`: relación usuario-negocio con roles `owner`, `admin` y
  `employee`.
- `devices`: equipos autorizados por negocio y usuario.

La función RPC `create_business(uuid, text)` crea el negocio y su membresía de
propietario en una sola transacción.

## Seguridad

- Todas las tablas públicas tienen Row Level Security habilitado.
- Los usuarios solo leen negocios a los que pertenecen.
- Solo propietarios y administradores gestionan miembros.
- Cada usuario únicamente registra o actualiza sus propios dispositivos.
- La aplicación usa exclusivamente la publishable key. Nunca contiene una
  `service_role` ni claves secretas de Stripe.

## Migración

La migración está en
`supabase/migrations/202608030001_auth_tenancy.sql`. El rollback manual está en
`supabase/rollback/202608030001_auth_tenancy.sql`.

## Siguiente entrega

Crear la suscripción mediante Stripe Checkout desde una Edge Function y enlazar
la activación del negocio exclusivamente desde webhooks verificados.
