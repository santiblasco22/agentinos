'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAgent, getConversations, getConversation, type Agent, type ConversationSummary, type Message } from '../../../../lib/api';
import { isLoggedIn } from '../../../../lib/auth';
import Navbar from '../../../../components/Navbar';
import { Character, type CharacterType } from '../../../../components/characters';
import { ArrowLeft, MessageCircle, User, Bot } from 'lucide-react';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000 - ts));
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

export default function ConversationsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [convList, setConvList] = useState<ConversationSummary[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const loadConversation = useCallback(async (phone: string) => {
    setLoadingMsgs(true);
    setSelectedPhone(phone);
    const msgs = await getConversation(id, phone);
    setMessages(msgs);
    setLoadingMsgs(false);
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    getAgent(id).then(setAgent);
    getConversations(id).then(setConvList);
  }, [id, router]);

  if (!agent) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="character-float"><Character type="gaucho" size={80} /></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 py-6 gap-4">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <button onClick={() => router.push(`/agents/${id}`)} className="flex items-center gap-2 text-sm mb-2" style={{ color: '#6B7280' }}>
            <ArrowLeft size={14} /> {agent.name}
          </button>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={16} color="#00D4FF" />
            <h2 className="font-bold" style={{ color: '#F0F4FF' }}>Conversaciones</h2>
            <span className="badge badge-blue ml-auto">{convList.length}</span>
          </div>

          {convList.length === 0 && (
            <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
              <MessageCircle size={32} color="#6B7280" />
              <p className="text-sm" style={{ color: '#6B7280' }}>Todavía no hay conversaciones</p>
            </div>
          )}

          {convList.map((conv) => (
            <button
              key={conv.phone}
              onClick={() => loadConversation(conv.phone)}
              className={`glass-card p-3 text-left transition-all hover:border-neon/30 ${selectedPhone === conv.phone ? 'border-cyan-400/50' : ''}`}
              style={{ borderColor: selectedPhone === conv.phone ? '#00D4FF40' : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User size={14} color="#6B7280" />
                </div>
                <span className="text-xs font-mono truncate" style={{ color: '#F0F4FF' }}>
                  {conv.phone.replace('whatsapp:', '')}
                </span>
              </div>
              <p className="text-xs truncate ml-9" style={{ color: '#6B7280' }}>{conv.lastMessage}</p>
              <div className="flex justify-between mt-1 ml-9">
                <span className="text-xs" style={{ color: '#6B7280' }}>{conv.messageCount} msgs</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{timeAgo(conv.lastActivity)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="flex-1 glass-card flex flex-col">
          {!selectedPhone && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Character type={agent.character as CharacterType} size={100} isActive />
              <p style={{ color: '#6B7280' }}>Seleccioná una conversación</p>
            </div>
          )}

          {selectedPhone && (
            <>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} color="#6B7280" />
                </div>
                <div>
                  <div className="font-mono text-sm font-semibold">{selectedPhone.replace('whatsapp:', '')}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>{messages.length} mensajes</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loadingMsgs && (
                  <div className="flex items-center justify-center py-8">
                    <div className="character-float"><Character type={agent.character as CharacterType} size={60} /></div>
                  </div>
                )}
                {!loadingMsgs && messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} items-end gap-2`}>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <User size={12} color="#6B7280" />
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-agent'}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      {msg.ts && (
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(msg.ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 flex-shrink-0">
                        <Character type={agent.character as CharacterType} size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
