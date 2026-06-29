import type { LLMProvider, LLMRequest, LLMResponse, LLMTurn, LLMTool, LLMToolCall } from './types';

// GLM (Zhipu AI) expone una API compatible con OpenAI. Soporta dos hosts según
// la cuenta: Z.ai (internacional) y BigModel (China). Se configura por env.
const DEFAULT_BASE = 'https://api.z.ai/api/paas/v4';
const BASE_URL = (process.env.GLM_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

function toOpenAITools(tools: LLMTool[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));
}

function toOpenAIMessages(system: string, turns: LLMTurn[]) {
  const out: Record<string, unknown>[] = [{ role: 'system', content: system }];
  for (const turn of turns) {
    if (turn.role === 'user') {
      out.push({ role: 'user', content: turn.content });
    } else if (turn.role === 'tool') {
      // OpenAI/GLM: un mensaje role:'tool' por cada resultado, ligado por tool_call_id.
      for (const r of turn.results) out.push({ role: 'tool', tool_call_id: r.id, content: r.content });
    } else if ('toolCalls' in turn && turn.toolCalls.length) {
      out.push({
        role: 'assistant',
        content: turn.content || null,
        tool_calls: turn.toolCalls.map((c): OpenAIToolCall => ({
          id: c.id,
          type: 'function',
          function: { name: c.name, arguments: JSON.stringify(c.input ?? {}) },
        })),
      });
    } else {
      out.push({ role: 'assistant', content: turn.content });
    }
  }
  return out;
}

function parseToolCalls(raw: OpenAIToolCall[] | undefined): LLMToolCall[] {
  if (!raw?.length) return [];
  return raw.map((tc) => {
    let input: Record<string, unknown> = {};
    try { input = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}; }
    catch { input = {}; }
    return { id: tc.id, name: tc.function.name, input };
  });
}

export const glmProvider: LLMProvider = {
  id: 'glm',
  async generate(req: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) throw new Error('GLM no configurado: falta GLM_API_KEY en el .env del backend.');

    const body = {
      model: req.model,
      max_tokens: req.maxTokens,
      messages: toOpenAIMessages(req.system, req.messages),
      tools: req.tools.length ? toOpenAITools(req.tools) : undefined,
      temperature: 0.6,
    };

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`GLM API ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const message = choice?.message ?? {};
    const finish = choice?.finish_reason;

    const toolCalls = parseToolCalls(message.tool_calls);
    const text = typeof message.content === 'string' ? message.content : '';

    const stopReason = (finish === 'tool_calls' || toolCalls.length) ? 'tool_use'
      : finish === 'content_filter' ? 'refusal'
      : finish === 'stop' ? 'end_turn'
      : 'other';

    return { stopReason, text, toolCalls };
  },
};
