import { getMessages, getConversationSummary, compactConversation, type StoredMessage } from '../db/database';
import { getProvider } from './llm';
import type { Agent } from '../types';

// Resumen rodante de memoria. En vez de mandar todo el historial al modelo en
// cada mensaje (costo de tokens creciente), mantenemos los últimos KEEP_RECENT
// mensajes crudos + un resumen acumulado de lo más viejo. Cuando el historial
// supera SUMMARY_THRESHOLD, condensamos lo viejo en el resumen.

const SUMMARY_THRESHOLD = 20; // a partir de acá, compactar
const KEEP_RECENT = 10;       // mensajes crudos que quedan tras compactar

// Modelo barato para resumir, independiente del modelo del agente. Si no está
// disponible (p. ej. GLM sin key), cae al modelo del propio agente.
const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? 'glm-4-flash';

function transcript(messages: StoredMessage[]): string {
  return messages.map((m) => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`).join('\n');
}

async function summarize(model: string, previousSummary: string, older: StoredMessage[]): Promise<string> {
  const provider = getProvider(model);
  const system = `Resumís conversaciones de atención al cliente por WhatsApp para mantener memoria entre mensajes.
Devolvé SOLO el resumen actualizado, conciso, en español y en tercera persona.
Incluí lo importante: nombre del cliente si lo dio, qué busca/compró/reservó, datos relevantes (dirección, preferencias), estado del pedido o turno, y temas pendientes.
No inventes nada que no esté en la conversación. Máximo ~150 palabras.`;
  const user = `Resumen previo (puede estar vacío):
${previousSummary || '(sin resumen aún)'}

Nuevos mensajes a incorporar:
${transcript(older)}

Devolvé el resumen actualizado.`;

  const res = await provider.generate({
    model,
    maxTokens: 400,
    system,
    tools: [],
    messages: [{ role: 'user', content: user }],
  });
  return res.text.trim();
}

// Compacta la conversación si superó el umbral. Pensado para correr en segundo
// plano (no bloquea la respuesta al cliente). Idempotente y tolerante a fallos:
// si el resumen falla, deja el historial como está y reintenta la próxima.
export async function maybeCompact(agent: Agent, phone: string): Promise<void> {
  const messages = getMessages(agent.id, phone);
  if (messages.length <= SUMMARY_THRESHOLD) return;

  const older = messages.slice(0, messages.length - KEEP_RECENT);
  const recent = messages.slice(-KEEP_RECENT);
  const previous = getConversationSummary(agent.id, phone);

  let summary = '';
  try {
    summary = await summarize(SUMMARY_MODEL, previous, older);
  } catch {
    // Fallback al modelo del agente si el modelo de resumen no está disponible.
    try { summary = await summarize(agent.model, previous, older); }
    catch (e) { console.error('[memory] no se pudo resumir:', e); return; }
  }

  if (!summary) return;
  compactConversation(agent.id, phone, summary, recent);
}
