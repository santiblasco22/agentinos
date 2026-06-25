import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db, getAgentById, getMessages } from '../db/database';
import { handleMessage } from '../agent/claude';

const router = Router();
router.use(requireAuth);

router.post('/:id/playground', async (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) {
    res.status(404).json({ error: 'Agente no encontrado' });
    return;
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'El mensaje es requerido' });
    return;
  }

  const phone = `playground:${req.userId}`;

  try {
    const reply = await handleMessage(agent, phone, message.trim());
    res.json({ reply });
  } catch (err) {
    console.error('[playground error]', err);
    res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
});

router.delete('/:id/playground', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) {
    res.status(404).json({ error: 'Agente no encontrado' });
    return;
  }

  const phone = `playground:${req.userId}`;
  db.prepare('DELETE FROM conversations WHERE agent_id = ? AND phone = ?').run(agent.id, phone);
  res.status(204).send();
});

router.get('/:id/playground', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) {
    res.status(404).json({ error: 'Agente no encontrado' });
    return;
  }

  const phone = `playground:${req.userId}`;
  const messages = getMessages(agent.id, phone);
  res.json(messages);
});

export default router;
