// Interfaz común de proveedor de IA. El loop agéntico (tool rounds, pagos, etc.)
// trabaja contra estos tipos normalizados; cada adapter (Anthropic, GLM) los
// traduce al formato nativo de su API. Así niveles 1/2 corren en GLM y 3/4 en
// Claude sin cambiar la lógica del agente.

export interface LLMTool {
  name: string;
  description: string;
  // JSON Schema del objeto de parámetros (mismo shape para todos los proveedores).
  inputSchema: Record<string, unknown>;
}

export interface LLMToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface LLMToolResult {
  id: string;
  name: string;
  content: string;
}

// Turnos normalizados de la conversación que se le pasan al proveedor.
export type LLMTurn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'assistant'; content: string; toolCalls: LLMToolCall[] }
  | { role: 'tool'; results: LLMToolResult[] };

export type LLMStopReason = 'end_turn' | 'tool_use' | 'refusal' | 'other';

export interface LLMResponse {
  stopReason: LLMStopReason;
  text: string;
  toolCalls: LLMToolCall[];
}

export interface LLMRequest {
  model: string;
  system: string;
  messages: LLMTurn[];
  tools: LLMTool[];
  maxTokens: number;
}

export interface LLMProvider {
  readonly id: string;
  generate(req: LLMRequest): Promise<LLMResponse>;
}
