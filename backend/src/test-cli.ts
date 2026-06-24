/**
 * CLI interactivo para probar el agente sin Twilio ni MercadoPago.
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-ant-... npx ts-node src/test-cli.ts
 *   ANTHROPIC_API_KEY=sk-ant-... DEMO_MODE=services npx ts-node src/test-cli.ts
 */
import 'dotenv/config';
import * as readline from 'readline';
import bcrypt from 'bcryptjs';
import * as db from './db/database';
import { handleMessage } from './agent/claude';
import type { Agent } from './types';

const DEMO_EMAIL = 'test@agentinos.com';
const DEMO_PASSWORD = 'test1234';
const DEMO_PHONE = 'whatsapp:+5491199999999';
const MODE = (process.env.DEMO_MODE ?? 'ecommerce') as 'ecommerce' | 'services';

// ── Seed user ─────────────────────────────────────────────
function seedUser() {
  const existing = db.getUserByEmail(DEMO_EMAIL);
  if (!existing) {
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    const user = db.createUser(DEMO_EMAIL, hash, 'Usuario Demo');
    console.log(`✅ Usuario creado: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return user;
  }
  return existing;
}

// ── Seed agent ────────────────────────────────────────────
function seedAgent(userId: string): Agent {
  const existing = db.getAgentsByUser(userId);
  const match = existing.find(a => a.name === `Demo ${MODE === 'ecommerce' ? 'Tienda' : 'Centro de Servicios'}`);
  if (match) return match;

  const agent = db.createAgent(userId, {
    name: MODE === 'ecommerce' ? 'Demo Tienda' : 'Demo Centro de Servicios',
    character: MODE === 'ecommerce' ? 'gaucho' : 'tanguera',
    mode: MODE,
    model: 'claude-opus-4-8',
    currency: 'ARS',
    color: MODE === 'ecommerce' ? '#DC2626' : '#7C3AED',
    whatsappNumber: 'whatsapp:+5491100000001',
  });

  if (MODE === 'ecommerce') {
    db.createProduct(agent.id, { name: 'Remera Básica',      description: 'Remera 100% algodón, talles S/M/L/XL',      price: 8500,  stock: 50, category: 'ropa' });
    db.createProduct(agent.id, { name: 'Jean Slim Fit',       description: 'Jean elastizado, varios colores',            price: 22000, stock: 30, category: 'ropa' });
    db.createProduct(agent.id, { name: 'Zapatillas Running',  description: 'Suela antideslizante, talles 36-45',         price: 45000, stock: 20, category: 'calzado' });
    db.createProduct(agent.id, { name: 'Mochila Urban 25L',   description: 'Compartimento laptop 15", impermeable',      price: 18000, stock: 15, category: 'accesorios' });
    db.createProduct(agent.id, { name: 'Gorra Snapback',      description: 'Ajustable, varios colores',                  price: 6500,  stock: 40, category: 'accesorios' });
    console.log('📦 5 productos de ejemplo cargados');
  } else {
    db.createService(agent.id, { name: 'Corte de cabello',    description: 'Corte con lavado y secado',                  price: 5000,  durationMinutes: 45,  category: 'cabello' });
    db.createService(agent.id, { name: 'Coloración completa', description: 'Tintura con técnica personalizada',          price: 15000, durationMinutes: 120, category: 'cabello' });
    db.createService(agent.id, { name: 'Manicura gel',        description: 'Esmaltado semipermanente, duración 3 semanas', price: 7000, durationMinutes: 60,  category: 'uñas' });
    db.createService(agent.id, { name: 'Limpieza facial',     description: 'Limpieza profunda + hidratación',            price: 9000,  durationMinutes: 75,  category: 'facial' });
    console.log('💼 4 servicios de ejemplo cargados');
  }

  return agent;
}

// ── Main ──────────────────────────────────────────────────
const user = seedUser();
const agent = seedAgent(user!.id);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`\n🤖 AGENTINOS CLI — ${agent.name} (modo: ${MODE})`);
console.log('   Escribí un mensaje y presioná Enter. Ctrl+C para salir.\n');

function prompt() {
  rl.question('Vos: ', async (input) => {
    const msg = input.trim();
    if (!msg) return prompt();
    try {
      process.stdout.write('Agente: ');
      const reply = await handleMessage(agent, DEMO_PHONE, msg);
      console.log(reply + '\n');
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    prompt();
  });
}

prompt();
