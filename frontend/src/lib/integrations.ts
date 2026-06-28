// Catálogo de integraciones. Cada agente (cada cliente) conecta las suyas con
// SUS PROPIAS credenciales — por eso cada integración declara qué campos pide.
// Las credenciales se guardan por agente en agent.integrations[key].credentials.
// MercadoPago es especial: usa el campo dedicado agent.mercadopagoToken (que ya
// consume el backend de pagos), por eso `usesTokenField`.
import {
  CreditCard, ShoppingBag, Store, Sheet, CalendarDays, Truck, Mail, Instagram, FileSpreadsheet, Users,
  type LucideIcon,
} from 'lucide-react';

export interface IntegrationField {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
}

export interface IntegrationDef {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  status: 'disponible' | 'pronto';
  usesTokenField?: boolean; // true → guarda en agent.mercadopagoToken
  fields: IntegrationField[];
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'mercadopago', name: 'Mercado Pago', color: '#00B1EA', icon: CreditCard, status: 'disponible',
    desc: 'Cobrá señas y ventas con link de pago automático.', usesTokenField: true,
    fields: [{ key: 'token', label: 'Access Token', secret: true, placeholder: 'APP_USR-...' }],
  },
  {
    key: 'tiendanube', name: 'Tiendanube', color: '#2D3EFF', icon: Store, status: 'pronto',
    desc: 'Sincronizá productos, stock y precios de tu tienda.',
    fields: [
      { key: 'storeId', label: 'ID de tienda', placeholder: '1234567' },
      { key: 'accessToken', label: 'Access token', secret: true },
    ],
  },
  {
    key: 'mercadolibre', name: 'Mercado Libre', color: '#FFB800', icon: ShoppingBag, status: 'pronto',
    desc: 'Respondé preguntas y ventas de tus publicaciones.',
    fields: [{ key: 'accessToken', label: 'Access token', secret: true }],
  },
  {
    key: 'google_sheets', name: 'Google Sheets', color: '#0F9D58', icon: Sheet, status: 'pronto',
    desc: 'Volcá pedidos, turnos y leads a una planilla.',
    fields: [{ key: 'sheetUrl', label: 'URL de la planilla', placeholder: 'https://docs.google.com/...' }],
  },
  {
    key: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: CalendarDays, status: 'pronto',
    desc: 'Agendá los turnos directamente en tu calendario.',
    fields: [{ key: 'calendarId', label: 'ID del calendario', placeholder: 'tucorreo@gmail.com' }],
  },
  {
    key: 'andreani', name: 'Andreani', color: '#E2001A', icon: Truck, status: 'pronto',
    desc: 'Cotizá y generá envíos sin salir del chat.',
    fields: [
      { key: 'clientId', label: 'Nº de cliente' },
      { key: 'apiKey', label: 'API key', secret: true },
    ],
  },
  {
    key: 'correo_argentino', name: 'Correo Argentino', color: '#0066B3', icon: Mail, status: 'pronto',
    desc: 'Envíos a todo el país desde la conversación.',
    fields: [{ key: 'apiKey', label: 'API key', secret: true }],
  },
  {
    key: 'instagram', name: 'Instagram', color: '#E1306C', icon: Instagram, status: 'pronto',
    desc: 'Atendé los DMs de Instagram con el mismo agente.',
    fields: [{ key: 'pageToken', label: 'Token de página', secret: true }],
  },
  {
    key: 'excel', name: 'Excel', color: '#217346', icon: FileSpreadsheet, status: 'pronto',
    desc: 'Importá tu catálogo desde una planilla de Excel.',
    fields: [],
  },
  {
    key: 'crm', name: 'CRM propio', color: '#7C3AED', icon: Users, status: 'pronto',
    desc: 'Etiquetá clientes y seguí leads calientes.',
    fields: [],
  },
];
