import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserById, countUsers } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  if (countUsers() > 0) {
    res.status(403).json({ error: 'Ya existe un usuario registrado. Contactá al administrador.' });
    return;
  }
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'email, password y name son requeridos' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const user = createUser(email, hash, name);
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '30d' });
  res.status(201).json({ token, user });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
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
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
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
