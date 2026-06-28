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

const MODEL_PRICE_PER_MILLION: Record<string, number> = {
  'claude-haiku-4-5': 1,
  'claude-haiku-4-5-20251001': 1,
  'claude-sonnet-4-6': 3,
  'claude-opus-4-8': 5,
  'claude-fable-5': 10,
};

router.get('/agents/:id/stats', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'No encontrado' }); return; }
  const stats = getAgentStats(req.params.id);
  const pricePerMillion = MODEL_PRICE_PER_MILLION[agent.model] ?? 3;
  const estimatedTokens = agent.responsesTotal * (agent.maxTokens + 500);
  const estimatedCostUSD = (estimatedTokens / 1_000_000) * pricePerMillion;
  res.json({
    ...stats,
    responsesToday: agent.responsesToday,
    responsesTotal: agent.responsesTotal,
    estimatedCostUSD: Math.round(estimatedCostUSD * 100) / 100,
    model: agent.model,
  });
});

export default router;
