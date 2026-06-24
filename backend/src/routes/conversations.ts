import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAgentById, getConversationList, getMessages, getAgentStats } from '../db/database';

const router = Router();
router.use(requireAuth);

router.get('/agents/:id/conversations', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'No encontrado' }); return; }
  res.json(getConversationList(req.params.id));
});

router.get('/agents/:id/conversations/:phone', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'No encontrado' }); return; }
  const phone = decodeURIComponent(req.params.phone);
  res.json(getMessages(req.params.id, phone));
});

router.get('/agents/:id/stats', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'No encontrado' }); return; }
  const stats = getAgentStats(req.params.id);
  res.json({ ...stats, responsesToday: agent.responsesToday, responsesTotal: agent.responsesTotal });
});

export default router;
