import type { Agent } from '../../types';

// ── Scaffold de RAG ────────────────────────────────────────────────────────
// HOY APAGADO por defecto. El catálogo se consulta por herramientas
// (determinístico y exacto), que para catálogos chicos/medianos es mejor que
// embeddings. Esta capa queda preparada para cuando un cliente tenga catálogo
// grande o se quiera búsqueda semántica sobre el "Conocimiento del negocio".
//
// Activación: GLM/Claude no cambian; se enciende con RAG_ENABLED=true en el .env.
// La v0 acá hace recuperación por solapamiento de palabras (cero costo, sin deps).
// Cuando se implemente el store de embeddings, se reemplaza retrieveContext()
// detrás de esta misma firma sin tocar el resto del agente.

export interface RagChunk {
  id: string;
  text: string;
  score: number;
}

export interface RagStore {
  // Indexa el conocimiento de un agente (knowledge + faqs) en el store vectorial.
  index(agent: Agent): Promise<void>;
  // Devuelve los fragmentos más relevantes para una consulta.
  search(agentId: string, query: string, topK: number): Promise<RagChunk[]>;
}

export function ragEnabled(): boolean {
  return process.env.RAG_ENABLED === 'true';
}

const STOP_WORDS = new Set([
  'el','la','los','las','un','una','de','del','y','o','a','en','que','con','por','para',
  'es','son','tu','tus','mi','me','te','se','lo','le','al','su','sus','como','cuanto','cuánto',
  'tienen','tenes','tenés','hay','quiero','necesito','hola','buenas','dia','día',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Parte el conocimiento del negocio en fragmentos (párrafos) + cada FAQ como uno.
function chunksFor(agent: Agent): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  const knowledge = agent.knowledge?.trim();
  if (knowledge) {
    knowledge.split(/\n{2,}/).forEach((para, i) => {
      const t = para.trim();
      if (t.length > 10) out.push({ id: `k${i}`, text: t });
    });
  }
  (agent.faqs ?? []).forEach((f, i) => {
    if (f.q?.trim() && f.a?.trim()) out.push({ id: `faq${i}`, text: `P: ${f.q.trim()}\nR: ${f.a.trim()}` });
  });
  return out;
}

// v0 de recuperación: ranking por solapamiento de palabras. Determinístico y
// gratis. Se reemplaza por similitud de embeddings cuando se monte el store.
export async function retrieveContext(agent: Agent, query: string, topK = 4): Promise<string> {
  if (!ragEnabled()) return '';
  const qTokens = new Set(tokenize(query));
  if (!qTokens.size) return '';

  const ranked = chunksFor(agent)
    .map((c) => {
      const cTokens = tokenize(c.text);
      const hits = cTokens.filter((w) => qTokens.has(w)).length;
      return { ...c, score: hits / Math.sqrt(cTokens.length || 1) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (!ranked.length) return '';
  return `Información relevante del negocio para esta consulta:\n${ranked.map((c) => `- ${c.text}`).join('\n')}`;
}
