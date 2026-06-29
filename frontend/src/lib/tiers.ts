// Capas de IA orientadas al usuario. El dueño del negocio elige "Rápida / Avanzada /
// Premium", no "Opus / Sonnet". El modelo real queda mapeado acá abajo y nunca se
// muestra en la UI principal. Si cambia un modelo, se toca solo este archivo.

export interface AiTier {
  id: string;        // modelo real (lo maneja el backend)
  label: string;     // lo que ve el usuario
  short: string;     // versión corta para badges
  desc: string;      // descripción de negocio
  color: string;
}

export const AI_TIERS: AiTier[] = [
  { id: 'glm-4-flash',       label: 'IA Rápida',    short: 'Rápida',    desc: 'Respuestas al toque. Ideal para alto volumen de consultas.', color: '#10B981' },
  { id: 'glm-4.6',           label: 'IA Avanzada',  short: 'Avanzada',  desc: 'Mejor comprensión y trato. El equilibrio justo.',            color: '#F59E0B' },
  { id: 'claude-opus-4-8',   label: 'IA Premium',   short: 'Premium',   desc: 'Máxima calidad de conversación para tus mejores clientes.',  color: '#EF4444' },
  { id: 'claude-fable-5',    label: 'IA Premium+',  short: 'Premium+',  desc: 'Lo más potente, para casos exigentes.',                      color: '#7C3AED' },
];

const DEFAULT_TIER = AI_TIERS[1]; // IA Avanzada

export function tierFor(modelId: string): AiTier {
  return AI_TIERS.find((t) => t.id === modelId) ?? { ...DEFAULT_TIER, id: modelId };
}
