'use client';
import { Bot, MessageCircle, Zap, Activity } from 'lucide-react';
import type { Agent } from '../lib/api';

interface StatsBarProps {
  agents: Agent[];
}

export default function StatsBar({ agents }: StatsBarProps) {
  const active = agents.filter((a) => a.isActive).length;
  const msgsToday = agents.reduce((s, a) => s + a.responsesToday, 0);
  const msgsTotal = agents.reduce((s, a) => s + a.responsesTotal, 0);
  const systemOk = agents.length === 0 || active > 0;

  const stats = [
    { icon: Bot, label: 'Total agentes', value: agents.length, color: '#00D4FF' },
    { icon: Activity, label: 'Activos ahora', value: active, color: '#10B981' },
    { icon: MessageCircle, label: 'Respuestas hoy', value: msgsToday, color: '#7C3AED' },
    { icon: Zap, label: 'Total respuestas', value: msgsTotal, color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
