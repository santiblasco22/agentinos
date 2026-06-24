import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAgentById, createProduct, getProducts, updateProduct, deleteProduct, createService, getServices, deleteService } from '../db/database';

const router = Router();
router.use(requireAuth);

function ownsAgent(userId: string, agentId: string): boolean {
  const agent = getAgentById(agentId);
  return !!(agent && agent.userId === userId);
}

// ── Products ──────────────────────────────────────────────
router.get('/agents/:id/products', (req: Request, res: Response) => {
  if (!ownsAgent(req.userId!, req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  res.json(getProducts(req.params.id));
});

router.post('/agents/:id/products', (req: Request, res: Response) => {
  if (!ownsAgent(req.userId!, req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  const { name, description, price, stock, category } = req.body;
  if (!name || !description || price == null || stock == null || !category) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return;
  }
  res.status(201).json(createProduct(req.params.id, { name, description, price: Number(price), stock: Number(stock), category }));
});

router.put('/products/:id', (req: Request, res: Response) => {
  updateProduct(req.params.id, req.body);
  res.sendStatus(200);
});

router.delete('/products/:id', (req: Request, res: Response) => {
  deleteProduct(req.params.id);
  res.sendStatus(204);
});

// ── Services ──────────────────────────────────────────────
router.get('/agents/:id/services', (req: Request, res: Response) => {
  if (!ownsAgent(req.userId!, req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  res.json(getServices(req.params.id));
});

router.post('/agents/:id/services', (req: Request, res: Response) => {
  if (!ownsAgent(req.userId!, req.params.id)) { res.status(404).json({ error: 'No encontrado' }); return; }
  const { name, description, price, durationMinutes, category } = req.body;
  if (!name || !description || price == null || !durationMinutes || !category) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return;
  }
  res.status(201).json(createService(req.params.id, { name, description, price: Number(price), durationMinutes: Number(durationMinutes), category }));
});

router.delete('/services/:id', (req: Request, res: Response) => {
  deleteService(req.params.id);
  res.sendStatus(204);
});

export default router;
