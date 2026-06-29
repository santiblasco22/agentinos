import { getToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Error de API');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export interface AuthUser { id: string; email: string; name: string; company?: string; phone?: string; }
export interface RegisterInput { name: string; email: string; password: string; company?: string; phone?: string; }

export const login = (email: string, password: string) =>
  request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (data: RegisterInput) =>
  request<{ token: string; user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMe = () => request<AuthUser>('/auth/me');

export const checkSetupRequired = () =>
  request<{ setupRequired: boolean }>('/auth/setup-required');

// Agents
export interface Faq { q: string; a: string; }
export interface Example { user: string; assistant: string; }
export interface AgentIntegration { enabled: boolean; credentials: Record<string, string>; }

export interface Agent {
  id: string;
  userId: string;
  name: string;
  character: string;
  mode: 'ecommerce' | 'services';
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

export const getAgents = () => request<Agent[]>('/agents');
export const getAgent = (id: string) => request<Agent>(`/agents/${id}`);
export const createAgent = (data: Partial<Agent>) =>
  request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) });
export const updateAgent = (id: string, data: Partial<Agent>) =>
  request<Agent>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAgent = (id: string) =>
  request<void>(`/agents/${id}`, { method: 'DELETE' });
export const toggleAgent = (id: string) =>
  request<{ isActive: boolean }>(`/agents/${id}/toggle`, { method: 'POST' });

// Catalog
export interface Product { id: string; name: string; description: string; price: number; stock: number; category: string; }
export interface Service { id: string; name: string; description: string; price: number; durationMinutes: number; category: string; }

export const getProducts = (agentId: string) => request<Product[]>(`/agents/${agentId}/products`);
export const createProduct = (agentId: string, data: Omit<Product, 'id'>) =>
  request<Product>(`/agents/${agentId}/products`, { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id: string, data: Partial<Product>) =>
  request<void>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id: string) =>
  request<void>(`/products/${id}`, { method: 'DELETE' });

export const getServices = (agentId: string) => request<Service[]>(`/agents/${agentId}/services`);
export const createService = (agentId: string, data: Omit<Service, 'id'>) =>
  request<Service>(`/agents/${agentId}/services`, { method: 'POST', body: JSON.stringify(data) });
export const deleteService = (id: string) =>
  request<void>(`/services/${id}`, { method: 'DELETE' });

// Conversations
export interface ConversationSummary { phone: string; lastMessage: string; messageCount: number; lastActivity: number; }
export interface Message { role: 'user' | 'assistant'; content: string; ts: number; }

export const getConversations = (agentId: string) =>
  request<ConversationSummary[]>(`/agents/${agentId}/conversations`);
export const getConversation = (agentId: string, phone: string) =>
  request<{ messages: Message[]; summary: string }>(`/agents/${agentId}/conversations/${encodeURIComponent(phone)}`);

export interface AgentStats {
  messagesToday: number; messagesTotal: number;
  responsesToday: number; responsesTotal: number;
  activeConversations: number;
  clientesAtendidos: number; turnosAgendados: number; ventasAsistidas: number;
  productosMasPreguntados: { name: string; count: number }[];
  tiempoAhorradoMin: number;
  estimatedCostUSD: number; model: string;
}
export const getAgentStats = (agentId: string) =>
  request<AgentStats>(`/agents/${agentId}/stats`);

// Playground
export const playgroundChat = (agentId: string, message: string) =>
  request<{ reply: string }>(`/agents/${agentId}/playground`, { method: 'POST', body: JSON.stringify({ message }) });
export const playgroundHistory = (agentId: string) =>
  request<Message[]>(`/agents/${agentId}/playground`);
export const playgroundClear = (agentId: string) =>
  request<void>(`/agents/${agentId}/playground`, { method: 'DELETE' });
