import type { LLMProvider } from './types';
import { anthropicProvider } from './anthropic';
import { glmProvider } from './glm';

export * from './types';

// Selecciona el proveedor según el ID del modelo. Los modelos GLM empiezan con
// "glm-"; el resto se asume Anthropic (Claude). Si más adelante sumamos otro
// proveedor, se agrega un prefijo acá.
export function getProvider(model: string): LLMProvider {
  if (model.startsWith('glm-')) return glmProvider;
  return anthropicProvider;
}
