import { getUserById, setConversationPaused, normalizeWhatsapp } from '../db/database';
import { sendWhatsApp } from '../services/twilio';
import type { Agent } from '../types';

// Detección determinística del pedido de "hablar con un humano". Cubre las
// formas más comunes en español rioplatense. Para intención difusa, el modelo
// dispone además de la tool request_human.
const ART = '((un[ao]?|el|la|los|las)\\s+)?'; // artículo opcional: un/una/el/la/...
const HANDOFF_RE = new RegExp(
  [
    `(hablar|comunicar(me)?|contactar(me)?|pasar|pasame|pas[aá]me|derivar(me)?|atend[ée]r?me)\\s+(con\\s+)?${ART}(humano|persona|alguien|agente|operador|representante|vendedor|encargad[ao]|due[ñn]o|asesor)`,
    'atenci[oó]n\\s+(humana|personal|de\\s+una\\s+persona)',
    `quiero\\s+(hablar\\s+con\\s+)?${ART}(humano|persona|operador|asesor)`,
    'persona\\s+real',
    'no\\s+(quiero|me\\s+sirve)\\s+(hablar\\s+con\\s+)?(un\\s+)?(bot|robot|m[aá]quina)',
  ].join('|'),
  'i',
);

export function looksLikeHandoff(text: string): boolean {
  return HANDOFF_RE.test(text);
}

// Resuelve el número de WhatsApp donde avisar al dueño: el del agente
// (notifyPhone) o, si no está, el teléfono de la cuenta del dueño.
function resolveNotifyNumber(agent: Agent): string | null {
  const owner = getUserById(agent.userId);
  return normalizeWhatsapp(agent.notifyPhone) ?? normalizeWhatsapp(owner?.phone);
}

// Pausa la conversación, avisa al dueño por WhatsApp y devuelve el mensaje que
// se le manda al cliente. A partir de acá el bot no responde ese chat hasta que
// el dueño lo reactive desde el panel.
export async function triggerHandoff(agent: Agent, customerPhone: string, reason?: string): Promise<string> {
  setConversationPaused(agent.id, customerPhone, true);

  const notify = resolveNotifyNumber(agent);
  const customerNum = customerPhone.replace('whatsapp:', '');

  if (notify && agent.whatsappNumber) {
    const reasonLine = reason ? `\n📝 "${reason.slice(0, 200)}"` : '';
    const msg = `🔔 *${agent.name}*: un cliente pidió hablar con una persona.\n\n📱 Cliente: ${customerNum}${reasonLine}\n\nEl bot quedó *en pausa* para ese chat. Respondé vos directo, y reactivá el bot desde el panel cuando termines.`;
    try {
      await sendWhatsApp(notify, msg, agent.whatsappNumber);
    } catch (e) {
      console.error('[handoff] no se pudo avisar al dueño:', e);
    }
  } else {
    console.warn(`[handoff] agente ${agent.id} sin número de aviso (configurá "notifyPhone" o el teléfono de la cuenta).`);
  }

  return 'Dale, te comunico con una persona del equipo 🙌 En un ratito te responden por acá.';
}
