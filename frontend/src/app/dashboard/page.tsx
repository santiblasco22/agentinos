'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getAgents, getMe } from '../../lib/api';
import { isLoggedIn } from '../../lib/auth';
import { useAgentsStore } from '../../store/useAgentsStore';
import Navbar from '../../components/Navbar';
import StatsBar from '../../components/StatsBar';
import AgentCard from '../../components/AgentCard';
import { Plus } from 'lucide-react';
import { Character } from '../../components/characters';

export default function DashboardPage() {
  const router = useRouter();
  const { agents, setAgents, updateAgent } = useAgentsStore();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    getMe().then((u) => setUserName(u.name)).catch(() => {});
  }, [router]);

  const { data, mutate, isLoading } = useSWR(isLoggedIn() ? 'agents' : null, getAgents, { refreshInterval: 30000 });
  const loading = isLoading && agents.length === 0;

  useEffect(() => {
    if (data) setAgents(data);
  }, [data, setAgents]);

  const handleToggle = (id: string, isActive: boolean) => {
    updateAgent(id, { isActive });
    mutate();
  };

  const firstName = userName.split(' ')[0];

  return (
    <div className="min-h-screen">
      <Navbar userName={userName} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 dot-grid min-h-[calc(100vh-56px)]">
        <StatsBar agents={agents} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {firstName && (
              <p className="text-sm mb-0.5" style={{ color: '#6B7280' }}>
                Hola, <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{firstName}</span> 👋
              </p>
            )}
            <h2 className="text-2xl font-bold" style={{ color: '#F0F4FF' }}>Mis Agentes</h2>
          </div>
          <button onClick={() => router.push('/agents/new')} className="btn-neon flex items-center gap-2">
            <Plus size={18} />
            Nuevo Agente
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-20 h-20 rounded-2xl" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
                <div className="flex gap-2 mt-2">
                  <div className="skeleton h-9 flex-1 rounded-full" />
                  <div className="skeleton h-9 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && agents.length === 0 && (
          <div className="glass-card p-16 flex flex-col items-center gap-6 text-center">
            <Character type="gaucho" size={120} isActive={false} />
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#F0F4FF' }}>No tenés agentes todavía</h3>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Creá tu primer agente para empezar a atender clientes por WhatsApp</p>
              <button onClick={() => router.push('/agents/new')} className="btn-neon flex items-center gap-2 mx-auto">
                <Plus size={18} />
                Crear mi primer agente
              </button>
            </div>
          </div>
        )}

        {/* Agent grid */}
        {agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} onToggle={handleToggle} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
