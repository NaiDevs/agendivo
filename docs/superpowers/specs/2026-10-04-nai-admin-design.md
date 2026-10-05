# Nai Admin — Spec de Diseño

**Fecha:** 2026-10-04  
**Proyecto:** `C:\Users\naide\OneDrive\Documentos\Proyectos\Nai\nai-admin\`  
**Stack:** Flutter (iOS + Android) · Supabase Edge Functions · Stripe API

---

## Propósito

App móvil personal para Nai Maldonado que centraliza la administración de usuarios y suscripciones de todas sus apps (empezando por Agendivo). Permite ver el estado de cada negocio/usuario, y activar o desactivar suscripciones tanto en Supabase como en Stripe.

---

## Decisiones clave

| Decisión | Elección | Razón |
|---|---|---|
| Framework | Flutter | Multi-proyecto, no atado al stack de cada app |
| Auth admin | PIN local (4 dígitos, Flutter Secure Storage) | Solo la usa Nai, extensible a futuro |
| Claves sensibles | Edge Functions como proxy | `service_role` y Stripe secret nunca tocan el dispositivo |
| Toggle suscripción | Supabase update + Stripe API | Fuente de verdad dual |
| Multi-proyecto | Config por proyecto en Secure Storage | `{ nombre, url, admin_secret }` por proyecto |

---

## Flujo de navegación

```
PIN → Proyectos → Negocios (lista) → Negocio (detalle)
```

### Pantalla 01 — PIN
- 4 dígitos, teclado numérico custom
- PIN guardado con `flutter_secure_storage` (cifrado por el SO)
- Sin backend propio, sin recuperación de PIN (es uso personal)
- Versión de la app en el footer

### Pantalla 02 — Proyectos
- Lista de apps configuradas (`AppConfig[]`)
- Por cada app: nombre, URL de Supabase, estado de conexión (ping al health endpoint)
- Stats rápidos: activos / cancelados / trial (llamada a `admin-list-businesses` que devuelve el conteo)
- Botón `+` para agregar nuevo proyecto (form: nombre, URL, admin_secret)
- Placeholder dimmado cuando no hay más proyectos

### Pantalla 03 — Negocios (lista)
- Header: nombre del proyecto + avatar N
- Chip de conexión con dot pulsante (verde = conectado)
- Resumen de conteos: activos / cancelados / trial
- Lista de tarjetas: negocio, owner email, status pill, días restantes
- Borde izquierdo de color según estado: amber (active), violet (trialing), red (canceled), gray (paused)
- Días restantes con semáforo: >30d normal, 10-30d amber, <10d red

### Pantalla 04 — Detalle de negocio
- Nombre del negocio + owner email
- **Card Suscripción:**
  - Dot pulsante + label de estado + toggle activar/desactivar
  - Barra de salud: período actual → días restantes (se vacía visualmente)
  - Grid: Plan, Vence, Stripe ID, Auto-renueva
- **Card Equipo:** lista de miembros con rol (owner/admin/empleado)
- **Card Dispositivos:** lista con nombre + última vez visto

---

## Arquitectura — Edge Functions por proyecto

Cada proyecto Supabase tiene 3 Edge Functions de admin protegidas con `ADMIN_SECRET`:

### `admin-list-businesses`
```
GET /functions/v1/admin-list-businesses
Authorization: Bearer <ADMIN_SECRET>

Response: {
  businesses: [{
    id, name, owner_email, status,
    current_period_end, plan_name,
    stripe_subscription_id
  }],
  summary: { active, trialing, canceled, paused }
}
```

Internamente hace un JOIN de `businesses` + `profiles` (owner) + `subscriptions` usando el cliente con `service_role`.

### `admin-get-business`
```
GET /functions/v1/admin-get-business?id=<business_id>
Authorization: Bearer <ADMIN_SECRET>

Response: {
  business: { id, name, owner_email, created_at },
  subscription: { status, stripe_subscription_id, stripe_customer_id,
                  stripe_price_id, current_period_end, cancel_at_period_end },
  members: [{ user_id, full_name, email, role }],
  devices: [{ id, name, last_seen_at, user_id }]
}
```

### `admin-update-subscription`
```
POST /functions/v1/admin-update-subscription
Authorization: Bearer <ADMIN_SECRET>
Body: { business_id: string, action: "activate" | "deactivate" }

Flujo activate:
  - Si status es 'paused': Stripe resume_collection → status = 'active'
  - Si status es 'canceled': solo actualiza Supabase status = 'active'
    (la suscripción de Stripe ya no existe; se asume que se manejó por fuera o
     es una activación manual de gracia)
  - Si stripe_subscription_id es null: solo actualiza Supabase status = 'active'

Flujo deactivate:
  1. Llama Stripe: pause_collection o cancel_at_period_end
  2. Actualiza subscriptions.status = 'paused' | 'canceled' en Supabase

Response: { success: bool, new_status: string, error?: string }
```

---

## Seguridad

- `ADMIN_SECRET` vive en las env vars de Supabase (nunca en el código)
- La app lo guarda en `flutter_secure_storage` (cifrado nativo del SO)
- Las Edge Functions verifican el header `Authorization: Bearer <secret>` antes de ejecutar
- Si el Bearer no coincide → 401 inmediato, sin info de error
- El PIN local protege el acceso a la app; si falla 5 veces consecutivas → app se bloquea 30 min

---

## Modelo de datos local (Flutter)

```dart
class AppConfig {
  final String id;          // uuid local
  final String name;        // "Agendivo"
  final String supabaseUrl; // "https://xxx.supabase.co"
  final String adminSecret; // guardado en Secure Storage
  final DateTime addedAt;
}
```

Los `AppConfig` se guardan en Secure Storage como JSON lista.

---

## Diseño visual (tokens)

| Token | Valor |
|---|---|
| `--ground` | `#0F0D14` |
| `--surface` | `#1A1625` |
| `--surface-2` | `#231D34` |
| `--text` | `#F0EDE8` |
| `--text-muted` | `#7A7390` |
| `--accent` | `#F5A623` (amber) |
| `--violet` | `#7C6CF0` |
| `--green` | `#3DD68C` |
| `--red` | `#F06B6B` |

Fuente: sistema (`-apple-system` / Roboto en Android), pesos 600-800.  
Animación: único punto de movimiento — dot pulsante en estados activos (breathe 2.4s).

---

## Dependencias Flutter (estimadas)

```yaml
dependencies:
  flutter_secure_storage: ^9.x    # PIN + configs cifradas
  http: ^1.x                      # llamadas a Edge Functions
  go_router: ^14.x                # navegación declarativa
  provider: ^6.x                  # state management simple
```

---

## Scope v1 — qué está incluido

- [x] PIN local de 4 dígitos
- [x] Listado de proyectos configurados
- [x] Agregar proyecto nuevo (nombre, URL, secret)
- [x] Lista de negocios por proyecto con stats
- [x] Detalle completo: suscripción + equipo + dispositivos
- [x] Toggle activar/desactivar suscripción (Supabase + Stripe)
- [x] Solo Agendivo como primer proyecto

## Fuera de scope v1

- [ ] Historial de cambios de status (log de acciones admin)
- [ ] Push notifications (alertas de suscripciones por vencer)
- [ ] Editar datos del negocio directamente
- [ ] Autenticación multi-admin
- [ ] Soporte web o desktop
