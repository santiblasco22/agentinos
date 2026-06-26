import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import type { Agent, User, Product, Service, CartItem, Booking } from '../types';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'agentinos.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    character TEXT NOT NULL DEFAULT 'gaucho',
    mode TEXT NOT NULL CHECK(mode IN ('ecommerce','services')),
    whatsapp_number TEXT UNIQUE,
    mercadopago_token TEXT NOT NULL DEFAULT '',
    custom_prompt TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'claude-opus-4-8',
    currency TEXT NOT NULL DEFAULT 'ARS',
    timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    working_hours TEXT NOT NULL DEFAULT '["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"]',
    working_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
    max_tokens INTEGER NOT NULL DEFAULT 1024,
    max_responses_per_day INTEGER NOT NULL DEFAULT 0,
    max_responses_total INTEGER NOT NULL DEFAULT 0,
    responses_today INTEGER NOT NULL DEFAULT 0,
    responses_total INTEGER NOT NULL DEFAULT 0,
    last_reset_date TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    color TEXT NOT NULL DEFAULT '#00D4FF',
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    service_id TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    client_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_url TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS conversations (
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    messages TEXT NOT NULL DEFAULT '[]',
    cart TEXT NOT NULL DEFAULT '[]',
    last_activity INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (agent_id, phone)
  );
`);

// ── Users ──────────────────────────────────────────────────

export function createUser(email: string, passwordHash: string, name: string): User {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
    .run(id, email, passwordHash, name);
  return { id, email, name };
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!row) return undefined;
  return { id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash };
}

export function getUserById(id: string): User | undefined {
  const row = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id) as any;
  return row ? { id: row.id, email: row.email, name: row.name } : undefined;
}

export function countUsers(): number {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any;
  return row.cnt;
}

// ── Agents ─────────────────────────────────────────────────

function rowToAgent(row: any): Agent {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    character: row.character,
    mode: row.mode,
    whatsappNumber: row.whatsapp_number ?? '',
    mercadopagoToken: row.mercadopago_token,
    customPrompt: row.custom_prompt,
    model: row.model,
    currency: row.currency,
    timezone: row.timezone,
    workingHours: JSON.parse(row.working_hours),
    workingDays: JSON.parse(row.working_days),
    maxTokens: row.max_tokens,
    maxResponsesPerDay: row.max_responses_per_day,
    maxResponsesTotal: row.max_responses_total,
    responsesToday: row.responses_today,
    responsesTotal: row.responses_total,
    isActive: row.is_active === 1,
    color: row.color,
    createdAt: row.created_at,
  };
}

// Normaliza el número de WhatsApp: devuelve null si no es un número real
// (vacío, solo "whatsapp:", o sin dígitos suficientes como "+54"). Esto evita
// colisiones de la restricción UNIQUE cuando se crean agentes sin número.
export function normalizeWhatsapp(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const num = trimmed.replace(/^whatsapp:/, '').trim();
  if (!num || !/\d{6,}/.test(num)) return null;
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${num}`;
}

export function createAgent(userId: string, data: Partial<Agent>): Agent {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO agents (id, user_id, name, character, mode, whatsapp_number, mercadopago_token,
      custom_prompt, model, currency, timezone, working_hours, working_days,
      max_tokens, max_responses_per_day, max_responses_total, is_active, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId,
    data.name ?? 'Nuevo Agente',
    data.character ?? 'gaucho',
    data.mode ?? 'ecommerce',
    normalizeWhatsapp(data.whatsappNumber),
    data.mercadopagoToken ?? '',
    data.customPrompt ?? '',
    data.model ?? 'claude-opus-4-8',
    data.currency ?? 'ARS',
    data.timezone ?? 'America/Argentina/Buenos_Aires',
    JSON.stringify(data.workingHours ?? ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']),
    JSON.stringify(data.workingDays ?? [1,2,3,4,5,6]),
    data.maxTokens ?? 1024,
    data.maxResponsesPerDay ?? 0,
    data.maxResponsesTotal ?? 0,
    1,
    data.color ?? '#00D4FF',
  );
  return rowToAgent(db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any);
}

export function getAgentById(id: string): Agent | undefined {
  const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
  return row ? rowToAgent(row) : undefined;
}

export function getAgentByNumber(whatsappNumber: string): Agent | undefined {
  const row = db.prepare('SELECT * FROM agents WHERE whatsapp_number = ? AND is_active = 1').get(whatsappNumber) as any;
  return row ? rowToAgent(row) : undefined;
}

export function getAgentsByUser(userId: string): Agent[] {
  return (db.prepare('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]).map(rowToAgent);
}

export function updateAgent(id: string, data: Partial<Agent>): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  const directMap: Record<string, string> = {
    name: 'name', character: 'character', mode: 'mode',
    whatsappNumber: 'whatsapp_number', mercadopagoToken: 'mercadopago_token',
    customPrompt: 'custom_prompt', model: 'model', currency: 'currency',
    timezone: 'timezone', maxTokens: 'max_tokens',
    maxResponsesPerDay: 'max_responses_per_day', maxResponsesTotal: 'max_responses_total',
    color: 'color',
  };

  for (const [key, col] of Object.entries(directMap)) {
    const val = (data as any)[key];
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(key === 'whatsappNumber' ? normalizeWhatsapp(val) : val);
    }
  }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
  if (data.workingHours !== undefined) { fields.push('working_hours = ?'); values.push(JSON.stringify(data.workingHours)); }
  if (data.workingDays !== undefined) { fields.push('working_days = ?'); values.push(JSON.stringify(data.workingDays)); }

  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteAgent(id: string): void {
  db.prepare('DELETE FROM agents WHERE id = ?').run(id);
}

export function toggleAgent(id: string): boolean {
  const row = db.prepare('SELECT is_active FROM agents WHERE id = ?').get(id) as any;
  if (!row) return false;
  const newVal = row.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE agents SET is_active = ? WHERE id = ?').run(newVal, id);
  return newVal === 1;
}

export function incrementResponses(agentId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT last_reset_date FROM agents WHERE id = ?').get(agentId) as any;
  if (row && row.last_reset_date !== today) {
    db.prepare('UPDATE agents SET responses_today = 0, last_reset_date = ? WHERE id = ?').run(today, agentId);
  }
  db.prepare('UPDATE agents SET responses_today = responses_today + 1, responses_total = responses_total + 1 WHERE id = ?').run(agentId);
}

// ── Products ───────────────────────────────────────────────

function rowToProduct(row: any): Product {
  return { id: row.id, name: row.name, description: row.description, price: row.price, stock: row.stock, category: row.category };
}

export function createProduct(agentId: string, data: Omit<Product, 'id'>): Product {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO products (id, agent_id, name, description, price, stock, category) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, agentId, data.name, data.description, data.price, data.stock, data.category);
  return { id, ...data };
}

export function getProducts(agentId: string, category?: string): Product[] {
  if (category) {
    return (db.prepare('SELECT * FROM products WHERE agent_id = ? AND category = ? AND active = 1').all(agentId, category) as any[]).map(rowToProduct);
  }
  return (db.prepare('SELECT * FROM products WHERE agent_id = ? AND active = 1').all(agentId) as any[]).map(rowToProduct);
}

export function getProduct(agentId: string, productId: string): Product | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND agent_id = ? AND active = 1').get(productId, agentId) as any;
  return row ? rowToProduct(row) : undefined;
}

export function searchProducts(agentId: string, query: string): Product[] {
  const q = `%${query}%`;
  return (db.prepare('SELECT * FROM products WHERE agent_id = ? AND active = 1 AND (name LIKE ? OR description LIKE ? OR category LIKE ?)').all(agentId, q, q, q) as any[]).map(rowToProduct);
}

export function updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { fields.push(`${k} = ?`); values.push(v); }
  }
  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProduct(id: string): void {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
}

// ── Services ───────────────────────────────────────────────

function rowToService(row: any): Service {
  return { id: row.id, name: row.name, description: row.description, price: row.price, durationMinutes: row.duration_minutes, category: row.category };
}

export function createService(agentId: string, data: Omit<Service, 'id'>): Service {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO services (id, agent_id, name, description, price, duration_minutes, category) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, agentId, data.name, data.description, data.price, data.durationMinutes, data.category);
  return { id, ...data };
}

export function getServices(agentId: string, category?: string): Service[] {
  if (category) {
    return (db.prepare('SELECT * FROM services WHERE agent_id = ? AND category = ? AND active = 1').all(agentId, category) as any[]).map(rowToService);
  }
  return (db.prepare('SELECT * FROM services WHERE agent_id = ? AND active = 1').all(agentId) as any[]).map(rowToService);
}

export function getService(agentId: string, serviceId: string): Service | undefined {
  const row = db.prepare('SELECT * FROM services WHERE id = ? AND agent_id = ? AND active = 1').get(serviceId, agentId) as any;
  return row ? rowToService(row) : undefined;
}

export function deleteService(id: string): void {
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(id);
}

// ── Availability ───────────────────────────────────────────

export function getAvailableSlots(agentId: string, date: string, workingHours: string[]): string[] {
  const booked = (db.prepare("SELECT time FROM bookings WHERE agent_id = ? AND date = ? AND status NOT IN ('cancelled')").all(agentId, date) as any[]).map((r) => r.time as string);
  return workingHours.filter((h) => !booked.includes(h));
}

// ── Bookings ───────────────────────────────────────────────

function rowToBooking(row: any): Booking {
  return { id: row.id, serviceId: row.service_id, date: row.date, time: row.time, clientName: row.client_name, status: row.status, paymentUrl: row.payment_url ?? undefined };
}

export function createBooking(agentId: string, phone: string, data: Omit<Booking, 'id' | 'status' | 'paymentUrl'>): Booking {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO bookings (id, agent_id, phone, service_id, date, time, client_name) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, agentId, phone, data.serviceId, data.date, data.time, data.clientName);
  return { id, ...data, status: 'pending' };
}

export function getActiveBooking(agentId: string, phone: string): Booking | undefined {
  const row = db.prepare("SELECT * FROM bookings WHERE agent_id = ? AND phone = ? AND status NOT IN ('cancelled') ORDER BY created_at DESC LIMIT 1").get(agentId, phone) as any;
  return row ? rowToBooking(row) : undefined;
}

export function updateBooking(id: string, status: Booking['status'], paymentUrl?: string): void {
  db.prepare('UPDATE bookings SET status = ?, payment_url = COALESCE(?, payment_url) WHERE id = ?').run(status, paymentUrl ?? null, id);
}

export function cancelBooking(id: string): void {
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
}

// ── Conversations ──────────────────────────────────────────

type StoredMessage = { role: 'user' | 'assistant'; content: string; ts: number };
const MAX_HISTORY = 50;

export function getMessages(agentId: string, phone: string): StoredMessage[] {
  const row = db.prepare('SELECT messages FROM conversations WHERE agent_id = ? AND phone = ?').get(agentId, phone) as any;
  return row ? JSON.parse(row.messages) : [];
}

export function addMessage(agentId: string, phone: string, role: 'user' | 'assistant', content: string): void {
  const messages = getMessages(agentId, phone);
  messages.push({ role, content, ts: Date.now() });
  const trimmed = messages.slice(-MAX_HISTORY);
  const cart = getCart(agentId, phone);
  db.prepare(`
    INSERT INTO conversations (agent_id, phone, messages, cart, last_activity)
    VALUES (?, ?, ?, ?, unixepoch())
    ON CONFLICT(agent_id, phone) DO UPDATE SET messages = excluded.messages, last_activity = excluded.last_activity
  `).run(agentId, phone, JSON.stringify(trimmed), JSON.stringify(cart));
}

export function getCart(agentId: string, phone: string): CartItem[] {
  const row = db.prepare('SELECT cart FROM conversations WHERE agent_id = ? AND phone = ?').get(agentId, phone) as any;
  return row ? JSON.parse(row.cart) : [];
}

export function saveCart(agentId: string, phone: string, cart: CartItem[]): void {
  db.prepare(`
    INSERT INTO conversations (agent_id, phone, messages, cart, last_activity)
    VALUES (?, ?, '[]', ?, unixepoch())
    ON CONFLICT(agent_id, phone) DO UPDATE SET cart = excluded.cart, last_activity = excluded.last_activity
  `).run(agentId, phone, JSON.stringify(cart));
}

export function getConversationList(agentId: string): { phone: string; lastMessage: string; messageCount: number; lastActivity: number }[] {
  return (db.prepare('SELECT phone, messages, last_activity FROM conversations WHERE agent_id = ? ORDER BY last_activity DESC').all(agentId) as any[]).map((row) => {
    const msgs: StoredMessage[] = JSON.parse(row.messages);
    const last = msgs[msgs.length - 1];
    return {
      phone: row.phone,
      lastMessage: last ? last.content.slice(0, 80) : '',
      messageCount: msgs.length,
      lastActivity: row.last_activity,
    };
  });
}

export function getAgentStats(agentId: string): { messagesToday: number; messagesTotal: number; activeConversations: number } {
  const today = new Date().toISOString().slice(0, 10);
  const convRows = db.prepare('SELECT messages, last_activity FROM conversations WHERE agent_id = ?').all(agentId) as any[];
  let messagesToday = 0;
  let messagesTotal = 0;
  let activeConversations = 0;
  const todayTs = new Date(today).getTime() / 1000;
  for (const row of convRows) {
    const msgs: StoredMessage[] = JSON.parse(row.messages);
    messagesTotal += msgs.length;
    const todayMsgs = msgs.filter((m) => m.ts / 1000 >= todayTs);
    messagesToday += todayMsgs.length;
    if (row.last_activity >= todayTs) activeConversations++;
  }
  return { messagesToday, messagesTotal, activeConversations };
}
