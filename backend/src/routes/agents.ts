import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createAgent, getAgentById, getAgentsByUser, updateAgent, deleteAgent, toggleAgent } from '../db/database';

const VALID_MODES = ['ecommerce', 'services'];
const VALID_MODELS = ['claude-haiku-4-5', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8', 'claude-fable-5'];
const VALID_CHARACTERS = ['gaucho', 'tanguera', 'asador', 'futbolero', 'cientifica', 'rockero', 'matera', 'porteno'];

function validateAgentPayload(body: Record<string, unknown>): string | null {
  if (body.name !== undefined && (typeof body.name !== 'string' || !String(body.name).trim())) return 'El nombre es requerido';
  if (body.mode !== undefined && !VALID_MODES.includes(body.mode as string)) return 'Modo inválido';
  if (body.model !== undefined && !VALID_MODELS.includes(body.model as string)) return 'Modelo inválido';
  if (body.character !== undefined && !VALID_CHARACTERS.includes(body.character as string)) return 'Personaje inválido';
  if (body.maxTokens !== undefined && (typeof body.maxTokens !== 'number' || body.maxTokens < 256 || body.maxTokens > 4096)) return 'maxTokens debe ser entre 256 y 4096';
  if (body.maxResponsesPerDay !== undefined && (typeof body.maxResponsesPerDay !== 'number' || body.maxResponsesPerDay < 0)) return 'maxResponsesPerDay inválido';
  if (body.maxResponsesTotal !== undefined && (typeof body.maxResponsesTotal !== 'number' || body.maxResponsesTotal < 0)) return 'maxResponsesTotal inválido';
  return null;
}

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  res.json(getAgentsByUser(req.userId!));
});

router.post('/', (req: Request, res: Response) => {
  if (!req.body.name?.trim()) { res.status(400).json({ error: 'El nombre es requerido' }); return; }
  if (!VALID_MODES.includes(req.body.mode)) { res.status(400).json({ error: 'Modo inválido' }); return; }
  const validationError = validateAgentPayload(req.body);
  if (validationError) { res.status(400).json({ error: validationError }); return; }
  try {
    const agent = createAgent(req.userId!, req.body);
    res.status(201).json(agent);
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Ya existe un agente con ese número de WhatsApp' });
      return;
    }
    console.error('Error creando agente:', e);
    res.status(500).json({ error: 'Error al crear el agente' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  res.json(agent);
});

router.put('/:id', (req: Request, res: Response) => {
  const agent = getAgentById(req.params.id);
  if (!agent || agent.userId !== req.userId) { res.status(404).json({ error: 'Agente no encontrado' }); return; }
  const validationError = validateAgentPayload(req.body);
  if (validationError) { res.status(400).json({ error: validationError }); return; }
  try {
    updateAgent(req.params.id, req.body);
    res.json(getAgentById(req.params.id));
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Ya existe un agente con ese número de WhatsApp' });
      return;
    }
    console.error('Error actualizando agente:', e);
    res.status(500).json({ error: 'Error al actualizar el agente' });
  }
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
