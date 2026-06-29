import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMRequest, LLMResponse, LLMTurn, LLMTool } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toAnthropicTools(tools: LLMTool[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

function toAnthropicMessages(turns: LLMTurn[]): Anthropic.MessageParam[] {
  return turns.map((turn): Anthropic.MessageParam => {
    if (turn.role === 'user') {
      return { role: 'user', content: turn.content };
    }
    if (turn.role === 'tool') {
      return {
        role: 'user',
        content: turn.results.map((r) => ({ type: 'tool_result' as const, tool_use_id: r.id, content: r.content })),
      };
    }
    // assistant
    if ('toolCalls' in turn && turn.toolCalls.length) {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (turn.content.trim()) blocks.push({ type: 'text', text: turn.content });
      for (const c of turn.toolCalls) blocks.push({ type: 'tool_use', id: c.id, name: c.name, input: c.input });
      return { role: 'assistant', content: blocks };
    }
    return { role: 'assistant', content: turn.content };
  });
}

export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  async generate(req: LLMRequest): Promise<LLMResponse> {
    const res = await client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      tools: toAnthropicTools(req.tools),
      messages: toAnthropicMessages(req.messages),
    });

    const text = res.content.filter((b) => b.type === 'text').map((b) => (b as Anthropic.TextBlock).text).join('\n');
    const toolCalls = res.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        const tb = b as Anthropic.ToolUseBlock;
        return { id: tb.id, name: tb.name, input: (tb.input ?? {}) as Record<string, unknown> };
      });

    const stopReason = res.stop_reason === 'tool_use' ? 'tool_use'
      : res.stop_reason === 'refusal' ? 'refusal'
      : res.stop_reason === 'end_turn' ? 'end_turn'
      : 'other';

    return { stopReason, text, toolCalls };
  },
};
