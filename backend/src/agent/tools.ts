import * as db from '../db/database';
import { createPaymentLink } from '../services/mercadopago';
import type { Agent } from '../types';
import type { LLMTool } from './llm/types';

export const ecommerceTools: LLMTool[] = [
  { name: 'list_products', description: 'Lista productos disponibles, opcionalmente por categoría.', inputSchema: { type: 'object', properties: { category: { type: 'string' } } } },
  { name: 'search_products', description: 'Busca productos por texto.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_product', description: 'Detalle de un producto por ID.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'add_to_cart', description: 'Agrega un producto al carrito.', inputSchema: { type: 'object', properties: { product_id: { type: 'string' }, quantity: { type: 'number' } }, required: ['product_id', 'quantity'] } },
  { name: 'remove_from_cart', description: 'Elimina un producto del carrito.', inputSchema: { type: 'object', properties: { product_id: { type: 'string' } }, required: ['product_id'] } },
  { name: 'view_cart', description: 'Muestra el carrito actual con totales.', inputSchema: { type: 'object', properties: {} } },
  { name: 'clear_cart', description: 'Vacía el carrito.', inputSchema: { type: 'object', properties: {} } },
  { name: 'create_payment', description: 'Crea link de pago MercadoPago. Solo cuando el cliente confirme la compra.', inputSchema: { type: 'object', properties: {} } },
];

export const servicesTools: LLMTool[] = [
  { name: 'list_services', description: 'Lista servicios disponibles, opcionalmente por categoría.', inputSchema: { type: 'object', properties: { category: { type: 'string' } } } },
  { name: 'get_service', description: 'Detalle de un servicio por ID.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'check_availability', description: 'Horarios de inicio disponibles para una fecha YYYY-MM-DD. Pasá service_id para que tenga en cuenta la duración del servicio. Respeta días/horarios laborales y nunca devuelve turnos pasados.', inputSchema: { type: 'object', properties: { date: { type: 'string' }, service_id: { type: 'string' } }, required: ['date'] } },
  { name: 'book_appointment', description: 'Reserva un turno y bloquea el horario según la duración del servicio. Verificá disponibilidad con check_availability (mismo service_id) antes de reservar.', inputSchema: { type: 'object', properties: { service_id: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, client_name: { type: 'string' } }, required: ['service_id', 'date', 'time', 'client_name'] } },
  { name: 'view_booking', description: 'Muestra la reserva activa del cliente.', inputSchema: { type: 'object', properties: {} } },
  { name: 'cancel_booking', description: 'Cancela la reserva activa.', inputSchema: { type: 'object', properties: {} } },
  { name: 'create_payment', description: 'Crea link de pago MercadoPago para la reserva.', inputSchema: { type: 'object', properties: {} } },
];

function fmt(amount: number, currency: string): string {
  try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount}`; }
}

export async function executeTool(name: string, input: Record<string, unknown>, agent: Agent, phone: string): Promise<string> {
  const aid = agent.id;
  try {
    switch (name) {
      case 'list_products': {
        const p = db.getProducts(aid, input.category as string | undefined);
        return p.length ? JSON.stringify(p) : 'No hay productos en esa categoría.';
      }
      case 'search_products': {
        const p = db.searchProducts(aid, input.query as string);
        return p.length ? JSON.stringify(p) : 'No se encontraron productos.';
      }
      case 'get_product': {
        const p = db.getProduct(aid, input.id as string);
        return p ? JSON.stringify(p) : 'Producto no encontrado.';
      }
      case 'add_to_cart': {
        const p = db.getProduct(aid, input.product_id as string);
        if (!p) return 'Producto no encontrado.';
        if (p.stock === 0) return `"${p.name}" está sin stock.`;
        const qty = Number(input.quantity);
        if (qty > p.stock) return `Solo hay ${p.stock} unidades de "${p.name}".`;
        const cart = db.getCart(aid, phone);
        const ex = cart.find((i) => i.productId === p.id);
        if (ex) ex.quantity += qty; else cart.push({ productId: p.id, quantity: qty });
        db.saveCart(aid, phone, cart);
        return `✅ "${p.name}" agregado (${qty}). Carrito: ${cart.length} producto(s).`;
      }
      case 'remove_from_cart': {
        const cart = db.getCart(aid, phone).filter((i) => i.productId !== input.product_id);
        db.saveCart(aid, phone, cart);
        return `Producto eliminado. Carrito: ${cart.length} producto(s).`;
      }
      case 'view_cart': {
        const items = db.getCart(aid, phone);
        if (!items.length) return 'El carrito está vacío.';
        let total = 0;
        const lines = items.map((item) => {
          const p = db.getProduct(aid, item.productId);
          if (!p) return `- (producto no disponible)`;
          const sub = p.price * item.quantity;
          total += sub;
          return `- ${p.name} x${item.quantity} = ${fmt(sub, agent.currency)}`;
        });
        lines.push(`\nTOTAL: ${fmt(total, agent.currency)}`);
        return lines.join('\n');
      }
      case 'clear_cart': {
        db.saveCart(aid, phone, []);
        return 'Carrito vaciado.';
      }
      case 'create_payment': {
        if (agent.mode === 'ecommerce') {
          const items = db.getCart(aid, phone);
          if (!items.length) return 'El carrito está vacío.';
          if (!agent.mercadopagoToken) return 'El negocio no tiene MercadoPago configurado. Consultá por otro medio de pago.';
          const mpItems = items.map((item) => { const p = db.getProduct(aid, item.productId)!; return { id: p.id, title: p.name, quantity: item.quantity, unit_price: p.price }; });
          const url = await createPaymentLink({ accessToken: agent.mercadopagoToken, items: mpItems, currency: agent.currency, externalRef: `cart-${aid}-${phone}` });
          return `PAYMENT_URL:${url}`;
        } else {
          const booking = db.getActiveBooking(aid, phone);
          if (!booking) return 'No hay reserva activa.';
          if (!agent.mercadopagoToken) return 'El negocio no tiene MercadoPago configurado. Tu turno queda reservado, coordiná el pago en el local.';
          const svc = db.getService(aid, booking.serviceId)!;
          const url = await createPaymentLink({ accessToken: agent.mercadopagoToken, items: [{ id: svc.id, title: svc.name, quantity: 1, unit_price: svc.price }], currency: agent.currency, externalRef: `booking-${aid}-${booking.id}` });
          db.updateBooking(booking.id, 'confirmed', url);
          return `PAYMENT_URL:${url}`;
        }
      }
      case 'list_services': {
        const s = db.getServices(aid, input.category as string | undefined);
        return s.length ? JSON.stringify(s) : 'No hay servicios en esa categoría.';
      }
      case 'get_service': {
        const s = db.getService(aid, input.id as string);
        return s ? JSON.stringify(s) : 'Servicio no encontrado.';
      }
      case 'check_availability': {
        const date = input.date as string;
        const svc = input.service_id ? db.getService(aid, input.service_id as string) : undefined;
        const slots = db.getAvailableSlots(agent, date, svc?.durationMinutes);
        return slots.length
          ? JSON.stringify({ date, durationMinutes: svc?.durationMinutes, availableSlots: slots })
          : `No hay turnos disponibles el ${date} (puede no ser un día laboral o estar completo).`;
      }
      case 'book_appointment': {
        const svc = db.getService(aid, input.service_id as string);
        if (!svc) return 'Servicio no encontrado.';
        const date = input.date as string;
        const time = input.time as string;
        const slots = db.getAvailableSlots(agent, date, svc.durationMinutes);
        if (!slots.includes(time)) {
          const alt = slots.slice(0, 6);
          return alt.length
            ? `El horario ${time} del ${date} no está disponible para "${svc.name}" (${svc.durationMinutes} min). Horarios libres: ${alt.join(', ')}.`
            : `No hay turnos disponibles el ${date} para "${svc.name}". Ofrecé otra fecha.`;
        }
        const booking = db.createBooking(aid, phone, { serviceId: svc.id, date, time, clientName: input.client_name as string });
        return JSON.stringify({ success: true, bookingId: booking.id, service: svc.name, durationMinutes: svc.durationMinutes, date: booking.date, time: booking.time, clientName: booking.clientName });
      }
      case 'view_booking': {
        const b = db.getActiveBooking(aid, phone);
        if (!b) return 'No tenés reserva activa.';
        const svc = db.getService(aid, b.serviceId);
        return JSON.stringify({ ...b, serviceName: svc?.name });
      }
      case 'cancel_booking': {
        const b = db.getActiveBooking(aid, phone);
        if (!b) return 'No hay reserva activa.';
        db.cancelBooking(b.id);
        return 'Reserva cancelada.';
      }
      default:
        return `Herramienta desconocida: ${name}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tool:${name}]`, msg);
    return `Error en ${name}: ${msg}`;
  }
}
