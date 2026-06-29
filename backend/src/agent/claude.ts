import { getSystemPrompt } from './prompts';
import { ecommerceTools, servicesTools, executeTool } from './tools';
import { getMessages, addMessage } from '../db/database';
import { getProvider, type LLMTurn } from './llm';
import type { Agent } from '../types';

const MAX_ROUNDS = 10;

export async function handleMessage(agent: Agent, phone: string, userMessage: string): Promise<string> {
  const tools = agent.mode === 'ecommerce' ? ecommerceTools : servicesTools;
  const system = getSystemPrompt(agent);
  const provider = getProvider(agent.model);

  addMessage(agent.id, phone, 'user', userMessage);
  const history = getMessages(agent.id, phone);

  // El historial persistido es texto plano (user/assistant). Los turnos de
  // tool-use/tool-result viven solo dentro de este loop.
  const messages: LLMTurn[] = history.map((m): LLMTurn =>
    m.role === 'user'
      ? { role: 'user', content: m.content }
      : { role: 'assistant', content: m.content }
  );

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await provider.generate({
      model: agent.model,
      maxTokens: agent.maxTokens,
      system,
      tools,
      messages,
    });

    if (response.stopReason === 'refusal') {
      const text = 'Perdón, no puedo ayudarte con eso. ¿Querés que te ayude con otra cosa?';
      addMessage(agent.id, phone, 'assistant', text);
      return text;
    }

    if (response.stopReason === 'tool_use' && response.toolCalls.length) {
      // Replay del turno del asistente con sus llamadas a tools.
      messages.push({ role: 'assistant', content: response.text, toolCalls: response.toolCalls });

      const results = [];
      for (const call of response.toolCalls) {
        let result = await executeTool(call.name, call.input, agent, phone);
        if (result.startsWith('PAYMENT_URL:')) {
          result = `Link de pago generado: ${result.replace('PAYMENT_URL:', '')}`;
        }
        results.push({ id: call.id, name: call.name, content: result });
      }

      messages.push({ role: 'tool', results });
      continue;
    }

    // end_turn (u otro): respuesta final.
    const text = response.text.trim() || '(sin respuesta)';
    addMessage(agent.id, phone, 'assistant', text);
    return text;
  }

  const fallback = 'Ocurrió un error. Por favor intentá de nuevo.';
  addMessage(agent.id, phone, 'assistant', fallback);
  return fallback;
}
