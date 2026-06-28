import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './prompts';
import { ecommerceTools, servicesTools, executeTool } from './tools';
import { getMessages, addMessage } from '../db/database';
import type { Agent } from '../types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_ROUNDS = 10;

export async function handleMessage(agent: Agent, phone: string, userMessage: string): Promise<string> {
  const tools = agent.mode === 'ecommerce' ? ecommerceTools : servicesTools;
  const system = getSystemPrompt(agent);

  addMessage(agent.id, phone, 'user', userMessage);
  const history = getMessages(agent.id, phone);

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: agent.model,
      max_tokens: agent.maxTokens,
      system,
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      const text = textBlock?.text ?? '(sin respuesta)';
      addMessage(agent.id, phone, 'assistant', text);
      return text;
    }

    // Los clasificadores de seguridad (p. ej. en Fable 5) pueden declinar el pedido.
    if (response.stop_reason === 'refusal') {
      const text = 'Perdón, no puedo ayudarte con eso. ¿Querés que te ayude con otra cosa?';
      addMessage(agent.id, phone, 'assistant', text);
      return text;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        let result = await executeTool(block.name, block.input as Record<string, unknown>, agent, phone);
        if (result.startsWith('PAYMENT_URL:')) {
          result = `Link de pago generado: ${result.replace('PAYMENT_URL:', '')}`;
        }
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  const fallback = 'Ocurrió un error. Por favor intentá de nuevo.';
  addMessage(agent.id, phone, 'assistant', fallback);
  return fallback;
}
