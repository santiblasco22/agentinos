import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserById, countUsers } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const company = typeof req.body.company === 'string' ? req.body.company.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  if (!name) { res.status(400).json({ error: 'El nombre es requerido' }); return; }
  if (!EMAIL_RE.test(email)) { res.status(400).json({ error: 'El email no es válido' }); return; }
  if (password.length < 8) { res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return; }

  if (getUserByEmail(email)) {
    res.status(409).json({ error: 'Ese email ya está registrado' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = createUser({ email, passwordHash: hash, name, company: company || null, phone: phone || null });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Ese email ya está registrado' });
      return;
    }
    console.error('Error registrando usuario:', e);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    res.status(400).json({ error: 'email y password son requeridos' });
    return;
  }
  const user = getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company, phone: user.phone } });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.userId!);
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
  res.json(user);
});

router.get('/setup-required', (_req: Request, res: Response) => {
  res.json({ setupRequired: countUsers() === 0 });
});

export default router;
