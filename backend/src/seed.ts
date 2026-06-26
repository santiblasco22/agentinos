/**
 * Seed de datos iniciales para AGENTINOS.
 * Crea un usuario admin y un agente de ejemplo si no existen.
 *
 * Uso:
 *   npm run seed
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import * as db from './db/database';

const EMAIL = process.env.SEED_EMAIL ?? 'admin@agentinos.com';
const PASSWORD = process.env.SEED_PASSWORD ?? 'agentinos2024';
const NAME = process.env.SEED_NAME ?? 'Admin';

function run() {
  // Usuario
  const existing = db.getUserByEmail(EMAIL);
  const user = existing ?? db.createUser({ email: EMAIL, passwordHash: bcrypt.hashSync(PASSWORD, 10), name: NAME, company: 'Agentinos' });
  if (!existing) {
    console.log(`✅ Usuario creado:`);
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
  } else {
    console.log(`ℹ️  Usuario ya existe: ${EMAIL}`);
  }

  // Agente de ejemplo
  const agents = db.getAgentsByUser(user.id);
  if (agents.length === 0) {
    const agent = db.createAgent(user.id, {
      name: 'Mi Primera Tienda',
      character: 'gaucho',
      mode: 'ecommerce',
      model: 'claude-opus-4-8',
      currency: 'ARS',
      color: '#DC2626',
    });

    db.createProduct(agent.id, { name: 'Producto de Ejemplo 1', description: 'Descripción del producto',  price: 10000, stock: 100, category: 'general' });
    db.createProduct(agent.id, { name: 'Producto de Ejemplo 2', description: 'Otro producto de prueba',   price: 25000, stock: 50,  category: 'general' });

    console.log(`✅ Agente de ejemplo creado: "${agent.name}"`);
    console.log(`   ID: ${agent.id}`);
  } else {
    console.log(`ℹ️  Ya existen ${agents.length} agente(s) para este usuario.`);
  }

  console.log('\n🚀 Listo. Iniciá el servidor con: npm run dev');
}

run();
