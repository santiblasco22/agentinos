import type { Agent } from '../types';

const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function getSystemPrompt(agent: Agent): string {
  const days = agent.workingDays.map((d) => DAY_NAMES[d]).join(', ');
  const hours = agent.workingHours.length
    ? `${agent.workingHours[0]} a ${agent.workingHours[agent.workingHours.length - 1]}`
    : 'horario flexible';

  const ahora = new Intl.DateTimeFormat('es-AR', {
    timeZone: agent.timezone, weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date());

  const base = `Sos el asistente virtual de "${agent.name}", atendiendo por WhatsApp.
Respondé siempre en español, de forma natural y concisa (mensajes cortos, ideales para WhatsApp).
Usá emojis con moderación. Precios en ${agent.currency}.
Fecha y hora actual: ${ahora} (zona ${agent.timezone}). Usala para interpretar "hoy", "mañana", "el viernes", etc.
${agent.customPrompt ? `\nInstrucciones específicas:\n${agent.customPrompt}` : ''}`;

  if (agent.mode === 'ecommerce') {
    return `${base}

Asistís en la compra de productos de la tienda.
Flujo: saludá → mostrá productos (list_products/search_products) → add_to_cart → view_cart → create_payment cuando el cliente confirme.
Reglas: verificá stock, no inventes productos, solo creá el pago cuando el cliente confirme explícitamente.`;
  }

  return `${base}

Gestionás turnos y reservas. Atendemos ${days}, de ${hours} hs.
Flujo: saludá → list_services → check_availability con la fecha YYYY-MM-DD y el service_id → book_appointment con nombre completo → create_payment para confirmar.
Reglas: no reserves sin nombre completo; convertí fechas a YYYY-MM-DD usando la fecha actual; el sistema solo permite turnos en días/horarios laborales y a futuro (bloquea automáticamente el horario según la duración del servicio); si el horario pedido no está libre, ofrecé los horarios alternativos que devuelve el sistema; confirmá fecha, hora y servicio antes de reservar.`;
}
