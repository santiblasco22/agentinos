# Agentinos — Claude Code Context

Sistema de gestión de agentes de IA para WhatsApp. Los usuarios crean agentes con personalidad argentina, los conectan a WhatsApp vía Twilio, y los agentes manejan conversaciones con clientes usando Claude API. Soporte de pagos vía MercadoPago.

## Stack

- **Backend**: Express + TypeScript + SQLite (`agentinos.db`) + Anthropic SDK
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Zustand
- **Integraciones**: Twilio (WhatsApp webhook), MercadoPago (pagos)

## Correr el proyecto

```bash
# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 3000)
cd frontend && npm run dev

# Probar agente sin WhatsApp
cd backend && npm run test-cli

# Crear DB con usuario admin y agente de ejemplo
cd backend && npm run seed
```

Credenciales por defecto: `admin@agentinos.com` / `agentinos2024`

## Estructura backend (`backend/src/`)

```
index.ts              — Express app, rutas, middleware CORS/JSON
types.ts              — Tipos compartidos (Agent, Conversation, Message, User)
db/database.ts        — SQLite schema y queries (better-sqlite3)
middleware/auth.ts    — JWT auth middleware
agent/
  claude.ts           — Lógica de conversación con Claude API (multi-turn)
  prompts.ts          — System prompts por personaje
  tools.ts            — Tool definitions para Claude (MercadoPago, info, etc.)
routes/
  auth.ts             — POST /auth/login, /auth/me
  agents.ts           — CRUD agentes del usuario autenticado
  conversations.ts    — GET conversaciones e historial de mensajes
  webhook.ts          — POST /webhook (Twilio → procesa mensaje → responde)
  catalog.ts          — GET personajes y modelos disponibles
services/
  twilio.ts           — Enviar mensajes WhatsApp vía Twilio REST
  mercadopago.ts      — Crear preferencias de pago y webhooks
seed.ts               — Crea usuario admin y agente de ejemplo
test-cli.ts           — REPL para probar agente en terminal
```

## Estructura frontend (`frontend/src/`)

```
app/
  page.tsx                          — Login
  dashboard/page.tsx                — Lista de agentes del usuario
  agents/new/page.tsx               — Crear nuevo agente (selector de personaje)
  agents/[id]/page.tsx              — Configuración del agente
  agents/[id]/conversations/page.tsx — Historial de conversaciones
components/
  AgentCard.tsx                     — Tarjeta de agente en dashboard
  Navbar.tsx                        — Nav con logo y logout
  StatsBar.tsx                      — Stats globales (mensajes, conversaciones)
  characters/index.tsx              — SVG avatares de los 8 personajes
lib/
  api.ts                            — Fetch wrapper con auth token
  auth.ts                           — LocalStorage para JWT token
store/
  useAgentsStore.ts                 — Zustand store para agentes
```

## Personajes disponibles

8 personajes con personalidad argentina, cada uno con system prompt propio:
`gaucho`, `tanguera`, `asador`, `futbolero`, `cientifica`, `rockero`, `matera`, `porteno`

## Modelos disponibles

- `claude-opus-4-8` — calidad máxima (default)
- `claude-sonnet-4-6` — balance calidad/costo
- `claude-haiku-4-5-20251001` — alto volumen

## Variables de entorno backend (`.env`)

```
ANTHROPIC_API_KEY=
JWT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
PUBLIC_URL=          # URL pública para webhooks (ngrok en dev)
FRONTEND_URL=        # Para CORS (default: http://localhost:3000)
PORT=3001
DB_PATH=./agentinos.db
```

## Notas importantes

- El DB es SQLite local (`backend/agentinos.db`), no hay ORM, queries directas con `better-sqlite3`
- El webhook de Twilio espera `From` y `Body` en el body del POST
- MercadoPago usa webhooks para confirmar pagos; necesita `PUBLIC_URL` accesible
- Los avatares SVG están en `frontend/src/components/characters/index.tsx` y también en `Documents/agentinos/avatars/`
- Auth es JWT stateless, el token va en `Authorization: Bearer <token>`
