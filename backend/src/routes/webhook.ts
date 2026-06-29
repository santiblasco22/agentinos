import { Router, Request, Response } from 'express';
import { getAgentByNumber, incrementResponses, isConversationPaused, addMessage } from '../db/database';
import { handleMessage } from '../agent/claude';
import { looksLikeHandoff, triggerHandoff } from '../agent/handoff';
import { sendWhatsApp } from '../services/twilio';

const router = Router();

router.post('/webhook', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  const to: string = req.body.To ?? '';
  const from: string = req.body.From ?? '';
  const body: string = (req.body.Body ?? '').trim();

  if (!to || !from || !body) return;

  const agent = getAgentByNumber(to);
  if (!agent) {
    console.warn(`[webhook] Número no registrado: ${to}`);
    return;
  }

  if (!agent.isActive) return;

  // Conversación derivada a humano: el bot no responde, solo registra el mensaje
  // para que el dueño lo vea en el panel.
  if (isConversationPaused(agent.id, from)) {
    addMessage(agent.id, from, 'user', body);
    console.log(`[${agent.name}] (en pausa) ${from}: ${body.slice(0, 60)}`);
    return;
  }

  // Pedido explícito de hablar con una persona: derivamos sin pasar por el modelo.
  if (looksLikeHandoff(body)) {
    addMessage(agent.id, from, 'user', body);
    triggerHandoff(agent, from, body)
      .then((reply) => { addMessage(agent.id, from, 'assistant', reply); return sendWhatsApp(from, reply, to); })
      .catch((err) => console.error('[handoff webhook]', err));
    return;
  }

  if (agent.maxResponsesPerDay > 0 && agent.responsesToday >= agent.maxResponsesPerDay) {
    sendWhatsApp(from, 'Lo sentimos, el servicio alcanzó su límite diario. Intentá mañana. 🙏', to).catch(console.error);
    return;
  }

  if (agent.maxResponsesTotal > 0 && agent.responsesTotal >= agent.maxResponsesTotal) {
    sendWhatsApp(from, 'Lo sentimos, el servicio alcanzó su límite de respuestas. 🙏', to).catch(console.error);
    return;
  }

  console.log(`[${agent.name}] ${from}: ${body.slice(0, 60)}`);

  handleMessage(agent, from, body)
    .then(async (reply) => {
      await sendWhatsApp(from, reply, to);
      incrementResponses(agent.id);
    })
    .catch((err) => {
      console.error('[webhook error]', err);
      sendWhatsApp(from, 'Ocurrió un error inesperado. Intentá en unos minutos.', to).catch(console.error);
    });
});

export default router;
