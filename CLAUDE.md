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
  planes/page.tsx                   — Pricing (Starter/Pro/Business + setup) — mockup, sin pagos
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

9 personajes con personalidad argentina por rubro:
`gaucho`, `tanguera`, `asador`, `futbolero`, `cientifica`, `rockero`, `matera`, `porteno`, `inmobiliario`
Definidos en `frontend/components/characters/index.tsx` (avatar SVG + CHARACTER_INFO) y validados en `backend/routes/agents.ts` (VALID_CHARACTERS) + `backend/types.ts`.

## Modelos disponibles (multi-proveedor)

- `glm-4-flash` — GLM (Zhipu), nivel "IA Rápida"
- `glm-4.6` — GLM (Zhipu), nivel "IA Avanzada" (**default** de nuevos agentes)
- `claude-opus-4-8` — Claude, nivel "IA Premium"
- `claude-fable-5` — Claude, nivel "IA Premium+" (clasificadores pueden devolver `stop_reason: 'refusal'`)

**Capa de proveedor** en `backend/agent/llm/`: interfaz común `LLMProvider` con tipos normalizados (turnos, tool-calls, stop reasons). Adapters `anthropic.ts` (Claude SDK) y `glm.ts` (Zhipu, API estilo OpenAI, traduce tool-calling). `getProvider(model)` rutea por prefijo: `glm-` → GLM, resto → Anthropic. El loop agéntico (`agent/claude.ts`) es agnóstico del proveedor. Las tools se definen como `LLMTool` (`inputSchema`) en `agent/tools.ts`.

GLM usa key **global de plataforma** (`GLM_API_KEY` en `.env`, opcional `GLM_BASE_URL` para BigModel vs Z.ai). La lista de modelos está en: `backend/routes/agents.ts` (VALID_MODELS) y `backend/routes/conversations.ts` (costos). En el **frontend NO se muestran nombres de modelos**: niveles "IA Rápida / Avanzada / Premium / Premium+" en `frontend/lib/tiers.ts` (`AI_TIERS` + `tierFor`). Al agregar un modelo: 2 lugares del backend + `lib/tiers.ts` (+ adapter si es proveedor nuevo).

## Variables de entorno backend (`.env`)

```
ANTHROPIC_API_KEY=
GLM_API_KEY=         # key global de GLM (Zhipu) para niveles 1/2
GLM_BASE_URL=        # opcional; default Z.ai. BigModel: https://open.bigmodel.cn/api/paas/v4
RAG_ENABLED=         # 'true' enciende el scaffold de RAG (default apagado)
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
- **Anti-alucinación**: `agent/prompts.ts` inyecta "REGLAS CRÍTICAS" (no inventar precios/stock/disponibilidad; consultar tools; si no hay dato, decirlo). El catálogo siempre sale de tools, no del prompt.
- **RAG** (`agent/rag/`): scaffold apagado por defecto (`RAG_ENABLED`). v0 hace recuperación por keywords sobre knowledge+faqs; se reemplaza por embeddings detrás de `retrieveContext()` cuando un cliente tenga catálogo grande. Se inyecta al system prompt en `agent/claude.ts` solo si está activo.
- El webhook de Twilio espera `From` y `Body` en el body del POST
- MercadoPago usa webhooks para confirmar pagos; necesita `PUBLIC_URL` accesible
- Los avatares SVG están en `frontend/src/components/characters/index.tsx` y también en `Documents/agentinos/avatars/`
- Auth es JWT stateless, el token va en `Authorization: Bearer <token>`
- Integraciones **por agente** (cada cliente con sus credenciales): tab "Integraciones" en `agents/[id]`. Catálogo en `frontend/lib/integrations.ts` (cada integración declara sus campos de credenciales). Se guardan en la columna JSON `integrations` de `agents` (mapa `key → {enabled, credentials}`). MercadoPago es especial: usa el campo dedicado `mercadopago_token` (`usesTokenField`). Solo MercadoPago está cableado de verdad; el resto guarda credenciales pero no sincroniza aún.
- Métricas de negocio (no de IA) en `getAgentStats` (`db/database.ts`): `clientesAtendidos` (phones únicos, excluye playground), `turnosAgendados`/`ventasAsistidas` (de `bookings`), `productosMasPreguntados` (menciones del catálogo en mensajes). `tiempoAhorradoMin` se calcula en el route de stats. Se muestran en el header de `agents/[id]`.
- "Entrenamiento" del agente (no es fine-tuning): el dueño carga `knowledge` (texto del negocio), `faqs` (`[{q,a}]`) y `examples` (`[{user,assistant}]`) desde el tab **Entrenamiento** en `agents/[id]`. Se guardan como columnas en `agents` y `getSystemPrompt` (`agent/prompts.ts`) los inyecta en el system prompt vía `getTrainingBlock`. Validación de tamaños en `routes/agents.ts`. Se prueba en el tab Playground.
