# AGENTINOS 🤖

Sistema de gestión de agentes de IA para WhatsApp. Creá, configurá y administrá múltiples agentes desde un panel web.

## Stack

- **Backend**: Express + TypeScript + SQLite + Claude API
- **Frontend**: Next.js 14 + Tailwind CSS
- **WhatsApp**: Twilio
- **Pagos**: MercadoPago

---

## Inicio rápido

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editá .env y completá ANTHROPIC_API_KEY y JWT_SECRET

npm install
npm run seed        # Crea el usuario admin y un agente de ejemplo
npm run dev         # Servidor en http://localhost:3001
```

Credenciales del seed por defecto:
- **Email**: admin@agentinos.com
- **Password**: agentinos2024

Podés cambiarlas con variables de entorno antes de correr seed:
```bash
SEED_EMAIL=yo@miemail.com SEED_PASSWORD=mipassword npm run seed
```

### 2. Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
npm run dev         # App en http://localhost:3000
```

Abrí **http://localhost:3000** e iniciá sesión con las credenciales del seed.

---

## Probar el agente sin WhatsApp

```bash
cd backend
ANTHROPIC_API_KEY=sk-ant-... npm run test-cli

# Modo servicios:
ANTHROPIC_API_KEY=sk-ant-... DEMO_MODE=services npm run test-cli
```

El test-cli crea automáticamente un usuario y agente de prueba con datos de ejemplo.

---

## Conectar WhatsApp (Twilio)

1. Crear cuenta en [twilio.com](https://twilio.com) (gratis para sandbox)
2. Completar `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` en `.env`
3. Exponer el servidor con ngrok: `npx ngrok http 3001`
4. En Twilio Sandbox → Webhook URL: `https://TU-URL.ngrok-free.app/webhook`
5. En AGENTINOS → configurá el número de WhatsApp del agente (ej. `whatsapp:+14155238886`)

---

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API Key de Anthropic |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mínimo 32 chars) |
| `TWILIO_ACCOUNT_SID` | Account SID de Twilio |
| `TWILIO_AUTH_TOKEN` | Auth Token de Twilio |
| `PUBLIC_URL` | URL pública del servidor (para webhooks de MP y Twilio) |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `PORT` | Puerto del servidor (default: 3001) |
| `DB_PATH` | Ruta al archivo SQLite (default: ./agentinos.db) |

---

## Personajes disponibles

| ID | Nombre | Color | Ideal para |
|---|---|---|---|
| `gaucho` | El Gaucho | Rojo | Ventas directas |
| `tanguera` | La Tanguera | Violeta | Servicios premium |
| `asador` | El Asador | Naranja | Gastronomía |
| `futbolero` | El Futbolero | Azul | Deportes |
| `cientifica` | La Científica | Verde | Salud / Tecnología |
| `rockero` | El Rockero | Púrpura oscuro | Entretenimiento |
| `matera` | La Matera | Verde azulado | Tradicional / Artesanal |
| `porteno` | El Porteño | Azul marino | Profesional / Corporativo |

---

## Modelos disponibles

| Modelo | Velocidad | Costo | Ideal para |
|---|---|---|---|
| `claude-opus-4-8` | Media | $5/1M tokens | Calidad máxima (default) |
| `claude-sonnet-4-6` | Rápida | $3/1M tokens | Balance calidad/costo |
| `claude-haiku-4-5` | Muy rápida | $1/1M tokens | Alto volumen |
