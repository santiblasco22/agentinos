'use client';
import { useRouter } from 'next/navigation';
import { Settings, MessageCircle, ShoppingBag, Calendar } from 'lucide-react';
import { Character, CHARACTER_INFO, type CharacterType } from './characters';
import type { Agent } from '../lib/api';
import { toggleAgent } from '../lib/api';

interface AgentCardProps {
  agent: Agent;
  onToggle: (id: string, isActive: boolean) => void;
  index?: number;
}

const MODEL_LABELS: Record<string, { label: string; color: string }> = {
  'claude-haiku-4-5':  { label: 'Haiku', color: '#10B981' },
  'claude-sonnet-4-6': { label: 'Sonnet', color: '#F59E0B' },
  'claude-opus-4-8':   { label: 'Opus', color: '#EF4444' },
  'claude-fable-5':    { label: 'Fable', color: '#7C3AED' },
};

const STAGGER = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6'];

export default function AgentCard({ agent, onToggle, index = 0 }: AgentCardProps) {
  const router = useRouter();
  const charInfo = CHARACTER_INFO[agent.character as CharacterType];
  const modelInfo = MODEL_LABELS[agent.model] ?? { label: agent.model, color: '#6B7280' };
  const pct = agent.maxResponsesPerDay > 0 ? Math.min(100, (agent.responsesToday / agent.maxResponsesPerDay) * 100) : 0;
  const stagger = STAGGER[index % STAGGER.length];

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { isActive } = await toggleAgent(agent.id);
    onToggle(agent.id, isActive);
  };

  return (
    <div
      className={`agent-card-wrap card-entrance ${stagger}`}
      style={{ '--glow-color': `${agent.color}55` } as React.CSSProperties}
    >
      {/* Color accent top bar */}
      <div className="card-accent-top" style={{ background: agent.color }} />

      <div className="glass-card-hover p-5 flex flex-col gap-4 glow-border h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Character type={agent.character as CharacterType} size={80} isActive={agent.responsesToday > 0} isOnline={agent.isActive} />
            <div>
              <div className="font-bold text-lg leading-tight" style={{ color: '#F0F4FF' }}>{agent.name}</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{charInfo?.name ?? agent.character}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className={agent.isActive ? 'pulse-dot' : 'pulse-dot-red'} />
                <span className="label-xs">{agent.isActive ? 'Activo' : 'Inactivo'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${agent.isActive ? 'bg-green-500' : 'bg-gray-600'}`}
            title={agent.isActive ? 'Desactivar' : 'Activar'}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${agent.isActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-blue">
            {agent.mode === 'ecommerce'
              ? <><ShoppingBag size={10} className="inline mr-1" />Tienda</>
              : <><Calendar size={10} className="inline mr-1" />Servicios</>}
          </span>
          <span className="badge" style={{ background: `${modelInfo.color}20`, color: modelInfo.color, border: `1px solid ${modelInfo.color}40` }}>
            {modelInfo.label}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1" style={{ color: '#6B7280' }}>
            <MessageCircle size={13} />
            <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{agent.responsesToday}</span>
            <span>hoy</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: '#6B7280' }}>
            <MessageCircle size={13} />
            <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{agent.responsesTotal}</span>
            <span>total</span>
          </div>
        </div>

        {/* Limit bar */}
        {agent.maxResponsesPerDay > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
              <span>Límite diario</span>
              <span style={{ color: pct >= 90 ? '#EF4444' : '#F0F4FF' }}>{agent.responsesToday}/{agent.maxResponsesPerDay}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#EF4444' : undefined }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="pill flex-1 justify-center"
            style={{ background: `${agent.color}25`, color: agent.color, border: `1px solid ${agent.color}50` }}
          >
            <Settings size={13} />
            Configurar
          </button>
          <button
            onClick={() => router.push(`/agents/${agent.id}/conversations`)}
            className="btn-ghost flex items-center gap-1.5 text-sm flex-1 justify-center py-2"
          >
            <MessageCircle size={14} />
            Chats
          </button>
        </div>
      </div>
    </div>
  );
}
