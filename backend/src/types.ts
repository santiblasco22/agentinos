export type AgentMode = 'ecommerce' | 'services';

export type CharacterType =
  | 'gaucho' | 'tanguera' | 'asador' | 'futbolero'
  | 'cientifica' | 'rockero' | 'matera' | 'porteno' | 'inmobiliario';

export interface Faq {
  q: string;
  a: string;
}

export interface Example {
  user: string;
  assistant: string;
}

// Config de una integración para UN agente. Cada cliente pone sus propias
// credenciales (store id, access token, etc.) — varían según la integración.
export interface AgentIntegration {
  enabled: boolean;
  credentials: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  character: CharacterType;
  mode: AgentMode;
  whatsappNumber: string;
  mercadopagoToken: string;
  customPrompt: string;
  knowledge: string;
  faqs: Faq[];
  examples: Example[];
  integrations: Record<string, AgentIntegration>;
  model: string;
  currency: string;
  timezone: string;
  workingHours: string[];
  workingDays: number[];
  maxTokens: number;
  maxResponsesPerDay: number;
  maxResponsesTotal: number;
  responsesToday: number;
  responsesTotal: number;
  isActive: boolean;
  color: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Booking {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paymentUrl?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
