import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createAgent, getAgentById, getAgentsByUser, updateAgent, deleteAgent, toggleAgent } from '../db/database';

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  res.json(getAgentsByUser(req.userId!));
});

router.post('/', (req: Request, res: Response) => {
  const agent = createAgent(req.userId!, req.body);
  res.status(201).json(agent);
});

router.get('/:id', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  res.json(agent);
});

router.put('/:id', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  updateAgent(req.params.id, req.body);
  res.json(getAgentById(req.params.id));
});

router.delete('/:id', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  deleteAgent(req.params.id);
  res.status(204).send();
});

router.post('/:id/toggle', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  const isActive = toggleAgent(req.params.id);
  res.json({ isActive });
});

export default router;
