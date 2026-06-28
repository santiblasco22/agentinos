'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAgent, updateAgent, deleteAgent, getProducts, createProduct, deleteProduct, getServices, createService, deleteService, getAgentStats, playgroundChat, playgroundHistory, playgroundClear, type Agent, type Product, type Service, type AgentStats, type Message } from '../../../lib/api';
import { isLoggedIn } from '../../../lib/auth';
import Navbar from '../../../components/Navbar';
import { Character, CHARACTER_INFO, type CharacterType } from '../../../components/characters';
import { Save, Trash2, Plus, ArrowLeft, ToggleLeft, ToggleRight, Send, RotateCcw, MessageSquare, User, Bot, DollarSign, BookOpen } from 'lucide-react';
import { toggleAgent } from '../../../lib/api';
import { toast } from '../../../components/Toaster';

const TABS = ['General', 'Entrenamiento', 'Personaje', 'Catálogo', 'Horarios', 'Límites', 'Avanzado', 'Playground'] as const;
type Tab = typeof TABS[number];

const MODELS = [
  { id: 'claude-haiku-4-5', label: 'Haiku', price: '$1/1M tokens', color: '#10B981' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet', price: '$3/1M tokens', color: '#F59E0B' },
  { id: 'claude-opus-4-8', label: 'Opus', price: '$5/1M tokens', color: '#EF4444' },
  { id: 'claude-fable-5', label: 'Fable', price: '$10/1M tokens', color: '#7C3AED' },
];
const CURRENCIES = ['ARS', 'USD', 'CLP', 'BRL', 'MXN'];
const TIMEZONES = ['America/Argentina/Buenos_Aires', 'America/Santiago', 'America/Lima', 'America/Bogota', 'America/Mexico_City', 'America/Montevideo'];
const HOURS = Array.from({ length: 24 }, (_, h) => [`${h.toString().padStart(2,'0')}:00`, `${h.toString().padStart(2,'0')}:30`]).flat();
const DAYS = [{ n: 0, l: 'Dom' }, { n: 1, l: 'Lun' }, { n: 2, l: 'Mar' }, { n: 3, l: 'Mié' }, { n: 4, l: 'Jue' }, { n: 5, l: 'Vie' }, { n: 6, l: 'Sáb' }];
const COLORS = ['#00D4FF', '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#DC2626', '#1D4ED8'];
const CHARACTERS = Object.entries(CHARACTER_INFO) as [CharacterType, typeof CHARACTER_INFO[CharacterType]][];

export default function AgentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [tab, setTab] = useState<Tab>('General');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Agent>>({});

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: '' });
  const [newService, setNewService] = useState({ name: '', description: '', price: '', durationMinutes: '', category: '' });

  // Playground state
  const [pgMessages, setPgMessages] = useState<Message[]>([]);
  const [pgInput, setPgInput] = useState('');
  const [pgLoading, setPgLoading] = useState(false);
  const [pgLoadingHistory, setPgLoadingHistory] = useState(false);
  const pgEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const a = await getAgent(id);
    setAgent(a);
    setForm({ ...a, whatsappNumber: a.whatsappNumber?.replace('whatsapp:', '') ?? '' });
    if (a.mode === 'ecommerce') setProducts(await getProducts(id));
    else setServices(await getServices(id));
    setStats(await getAgentStats(id));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    load();
  }, [router, load]);

  useEffect(() => {
    if (tab === 'Playground' && pgMessages.length === 0) {
      setPgLoadingHistory(true);
      playgroundHistory(id).then(msgs => {
        setPgMessages(msgs);
        setPgLoadingHistory(false);
      }).catch(() => setPgLoadingHistory(false));
    }
  }, [tab, id, pgMessages.length]);

  useEffect(() => {
    pgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pgMessages]);

  const save = async (data: Partial<Agent>) => {
    setSaving(true);
    try {
      const payload = { ...data, whatsappNumber: data.whatsappNumber ? `whatsapp:${data.whatsappNumber}` : data.whatsappNumber };
      const updated = await updateAgent(id, payload);
      setAgent(updated);
      setForm({ ...updated, whatsappNumber: updated.whatsappNumber?.replace('whatsapp:', '') ?? '' });
      toast.success('Cambios guardados');
    } catch (e) { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!agent) return;
    const { isActive } = await toggleAgent(id);
    setAgent({ ...agent, isActive });
    toast.info(isActive ? 'Agente activado' : 'Agente desactivado');
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que querés eliminar este agente? Esta acción no se puede deshacer.')) return;
    await deleteAgent(id);
    router.push('/dashboard');
  };

  const sendPlayground = async () => {
    if (!pgInput.trim() || pgLoading) return;
    const userMsg: Message = { role: 'user', content: pgInput.trim(), ts: Date.now() };
    setPgMessages(prev => [...prev, userMsg]);
    setPgInput('');
    setPgLoading(true);
    try {
      const { reply } = await playgroundChat(id, userMsg.content);
      setPgMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      setPgMessages(prev => [...prev, { role: 'assistant', content: '⚠ Error al procesar el mensaje', ts: Date.now() }]);
    } finally {
      setPgLoading(false);
    }
  };

  const clearPlayground = async () => {
    await playgroundClear(id);
    setPgMessages([]);
  };

  if (!agent) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-float">
        <Character type="gaucho" size={80} isActive />
      </div>
    </div>
  );

  const charInfo = CHARACTER_INFO[agent.character as CharacterType];
  const pct = agent.maxResponsesPerDay > 0 ? Math.min(100, (agent.responsesToday / agent.maxResponsesPerDay) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm mb-6" style={{ color: '#6B7280' }}>
          <ArrowLeft size={15} /> Volver al dashboard
        </button>

        {/* Agent header */}
        <div className="glass-card p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <Character type={agent.character as CharacterType} size={120} isActive={agent.responsesToday > 0} isOnline={agent.isActive} />
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-2xl font-black">{agent.name}</h1>
              <span className={`badge ${agent.isActive ? 'badge-green' : 'badge-red'}`}>{agent.isActive ? '● Activo' : '○ Inactivo'}</span>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{charInfo?.name} • {agent.mode === 'ecommerce' ? 'Tienda' : 'Servicios'} • {agent.model.split('-')[1]}</p>
            {stats && (
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <div><span style={{ color: '#00D4FF', fontWeight: 700 }}>{stats.messagesToday}</span> <span style={{ color: '#6B7280' }}>msgs hoy</span></div>
                <div><span style={{ color: '#7C3AED', fontWeight: 700 }}>{stats.messagesTotal}</span> <span style={{ color: '#6B7280' }}>msgs total</span></div>
                <div><span style={{ color: '#10B981', fontWeight: 700 }}>{stats.activeConversations}</span> <span style={{ color: '#6B7280' }}>chats activos</span></div>
                <div><span style={{ color: '#F59E0B', fontWeight: 700 }}>{agent.responsesToday}</span> <span style={{ color: '#6B7280' }}>respuestas hoy</span></div>
                {stats.estimatedCostUSD > 0 && (
                  <div><span style={{ color: '#EF4444', fontWeight: 700 }}>${stats.estimatedCostUSD.toFixed(2)}</span> <span style={{ color: '#6B7280' }}>costo est.</span></div>
                )}
              </div>
            )}
            {agent.maxResponsesPerDay > 0 && (
              <div className="mt-3 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
                  <span>Límite diario</span>
                  <span style={{ color: pct >= 90 ? '#EF4444' : '#F0F4FF' }}>{agent.responsesToday}/{agent.maxResponsesPerDay}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#EF4444' : undefined }} /></div>
              </div>
            )}
          </div>
          <button onClick={handleToggle} className={`flex items-center gap-2 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${agent.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
            {agent.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {agent.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${tab === t ? 'tab-active' : 'tab-inactive'}`}>
              {t === 'Playground' ? '▶ Playground' : t === 'Entrenamiento' ? '🎓 Entrenamiento' : t}
            </button>
          ))}
        </div>

        {/* GENERAL */}
        {tab === 'General' && (
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg mb-2">Configuración general</h3>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NOMBRE</label>
              <input className="input-dark" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NÚMERO WHATSAPP</label>
              <input className="input-dark" value={form.whatsappNumber ?? ''} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="+54911..." />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>TOKEN MERCADOPAGO</label>
              <input className="input-dark" value={form.mercadopagoToken ?? ''} onChange={e => setForm({ ...form, mercadopagoToken: e.target.value })} type="password" placeholder="APP_USR-..." />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>INSTRUCCIONES EXTRAS (prompt personalizado)</label>
              <textarea className="input-dark resize-none" rows={5} value={form.customPrompt ?? ''} onChange={e => setForm({ ...form, customPrompt: e.target.value })} placeholder="Ej: Siempre saludá con '¡Bienvenido!' y ofrecé descuentos en días lluviosos..." />
            </div>
            <button onClick={() => save(form)} disabled={saving} className="btn-neon flex items-center gap-2 self-start mt-2">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}

        {/* ENTRENAMIENTO */}
        {tab === 'Entrenamiento' && (
          <div className="glass-card p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <BookOpen size={18} color="#00D4FF" />
              <h3 className="font-bold text-lg">Entrenar al agente</h3>
            </div>
            <p className="text-sm -mt-3" style={{ color: '#6B7280' }}>
              Enseñale a tu agente sobre tu negocio. Cuanto más completo, mejor responde y menos inventa. Probá los cambios en el Playground antes de activarlo.
            </p>

            {/* Conocimiento */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>CONOCIMIENTO DEL NEGOCIO</label>
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Ubicación, formas de pago, políticas, datos clave. El agente responde a partir de esto.</p>
              <textarea
                className="input-dark resize-none"
                rows={7}
                maxLength={8000}
                value={form.knowledge ?? ''}
                onChange={e => setForm({ ...form, knowledge: e.target.value })}
                placeholder={'Ej:\n- Estamos en Av. Corrientes 1234, CABA.\n- Aceptamos efectivo, débito y MercadoPago.\n- Las señas no se reintegran si cancelás con menos de 24hs.\n- Atendemos sin turno solo de lunes a viernes a la mañana.'}
              />
              <div className="text-xs text-right mt-1" style={{ color: '#6B7280' }}>{(form.knowledge ?? '').length}/8000</div>
            </div>

            {/* FAQs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#6B7280' }}>PREGUNTAS FRECUENTES</label>
                <span className="text-xs" style={{ color: '#6B7280' }}>{(form.faqs ?? []).length}/50</span>
              </div>
              <div className="flex flex-col gap-3">
                {(form.faqs ?? []).map((f, i) => (
                  <div key={i} className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <input className="input-dark flex-1" placeholder="Pregunta del cliente" maxLength={300}
                        value={f.q} onChange={e => setForm({ ...form, faqs: (form.faqs ?? []).map((x, idx) => idx === i ? { ...x, q: e.target.value } : x) })} />
                      <button onClick={() => setForm({ ...form, faqs: (form.faqs ?? []).filter((_, idx) => idx !== i) })} style={{ color: '#EF4444' }}><Trash2 size={15} /></button>
                    </div>
                    <textarea className="input-dark resize-none" rows={2} placeholder="Respuesta" maxLength={1000}
                      value={f.a} onChange={e => setForm({ ...form, faqs: (form.faqs ?? []).map((x, idx) => idx === i ? { ...x, a: e.target.value } : x) })} />
                  </div>
                ))}
                {(form.faqs ?? []).length === 0 && <p className="text-xs py-2" style={{ color: '#6B7280' }}>Sin preguntas frecuentes todavía.</p>}
              </div>
              {(form.faqs ?? []).length < 50 && (
                <button onClick={() => setForm({ ...form, faqs: [...(form.faqs ?? []), { q: '', a: '' }] })} className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#00D4FF' }}>
                  <Plus size={15} /> Agregar pregunta
                </button>
              )}
            </div>

            {/* Ejemplos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#6B7280' }}>EJEMPLOS DE CONVERSACIÓN</label>
                <span className="text-xs" style={{ color: '#6B7280' }}>{(form.examples ?? []).length}/30</span>
              </div>
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Mostrale cómo querés que responda en casos típicos. Guía el estilo, no lo copia textual.</p>
              <div className="flex flex-col gap-3">
                {(form.examples ?? []).map((ex, i) => (
                  <div key={i} className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <input className="input-dark flex-1" placeholder="Mensaje del cliente" maxLength={500}
                        value={ex.user} onChange={e => setForm({ ...form, examples: (form.examples ?? []).map((x, idx) => idx === i ? { ...x, user: e.target.value } : x) })} />
                      <button onClick={() => setForm({ ...form, examples: (form.examples ?? []).filter((_, idx) => idx !== i) })} style={{ color: '#EF4444' }}><Trash2 size={15} /></button>
                    </div>
                    <textarea className="input-dark resize-none" rows={2} placeholder="Cómo debería responder el agente" maxLength={1000}
                      value={ex.assistant} onChange={e => setForm({ ...form, examples: (form.examples ?? []).map((x, idx) => idx === i ? { ...x, assistant: e.target.value } : x) })} />
                  </div>
                ))}
                {(form.examples ?? []).length === 0 && <p className="text-xs py-2" style={{ color: '#6B7280' }}>Sin ejemplos todavía.</p>}
              </div>
              {(form.examples ?? []).length < 30 && (
                <button onClick={() => setForm({ ...form, examples: [...(form.examples ?? []), { user: '', assistant: '' }] })} className="flex items-center gap-1.5 text-sm mt-2" style={{ color: '#00D4FF' }}>
                  <Plus size={15} /> Agregar ejemplo
                </button>
              )}
            </div>

            <button onClick={() => save({
              knowledge: form.knowledge,
              faqs: (form.faqs ?? []).filter(f => f.q.trim() && f.a.trim()),
              examples: (form.examples ?? []).filter(e => e.user.trim() && e.assistant.trim()),
            })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar entrenamiento'}
            </button>
          </div>
        )}

        {/* PERSONAJE */}
        {tab === 'Personaje' && (
          <div className="glass-card p-6 flex flex-col gap-6">
            <h3 className="font-bold text-lg">Personalidad del agente</h3>
            <div>
              <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>PERSONAJE</label>
              <div className="grid grid-cols-4 gap-3">
                {CHARACTERS.map(([key, info]) => (
                  <button key={key} onClick={() => setForm({ ...form, character: key })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${form.character === key ? 'border-neon' : 'border-white/10 hover:border-white/20'}`}
                    style={{ borderColor: form.character === key ? info.color : undefined, background: form.character === key ? `${info.color}15` : 'rgba(255,255,255,0.03)' }}>
                    <Character type={key} size={48} isActive={form.character === key} />
                    <span className="text-xs font-medium" style={{ color: form.character === key ? info.color : '#6B7280' }}>{info.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>COLOR DE ACENTO</label>
              <div className="flex gap-3 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-9 h-9 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            {form.character && (
              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-sm font-semibold mb-1">{CHARACTER_INFO[form.character as CharacterType]?.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{CHARACTER_INFO[form.character as CharacterType]?.description}</p>
              </div>
            )}
            <button onClick={() => save({ character: form.character, color: form.color })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar personaje'}
            </button>
          </div>
        )}

        {/* CATÁLOGO */}
        {tab === 'Catálogo' && (
          <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-4">{agent.mode === 'ecommerce' ? 'Productos' : 'Servicios'}</h3>

            {agent.mode === 'ecommerce' && (
              <>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left" style={{ color: '#6B7280' }}>
                      <th className="pb-2">Nombre</th><th className="pb-2">Categoría</th>
                      <th className="pb-2 text-right">Precio</th><th className="pb-2 text-right">Stock</th><th className="pb-2"></th>
                    </tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <td className="py-2.5 font-medium">{p.name}</td>
                          <td className="py-2.5" style={{ color: '#6B7280' }}>{p.category}</td>
                          <td className="py-2.5 text-right">${p.price.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 text-right">{p.stock}</td>
                          <td className="py-2.5 text-right">
                            <button onClick={async () => { await deleteProduct(p.id); setProducts(await getProducts(id)); toast.success('Producto eliminado'); }} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && <tr><td colSpan={5} className="py-6 text-center" style={{ color: '#6B7280' }}>Sin productos todavía</td></tr>}
                    </tbody>
                  </table>
                </div>
                <h4 className="font-semibold mb-3 text-sm" style={{ color: '#00D4FF' }}>+ Agregar producto</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="input-dark" placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                  <input className="input-dark" placeholder="Categoría" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                  <input className="input-dark" placeholder="Precio" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                  <input className="input-dark" placeholder="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                  <input className="input-dark col-span-2" placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <button onClick={async () => {
                  if (!newProduct.name || !newProduct.price) return;
                  await createProduct(id, { name: newProduct.name, description: newProduct.description, price: Number(newProduct.price), stock: Number(newProduct.stock), category: newProduct.category });
                  setNewProduct({ name: '', description: '', price: '', stock: '', category: '' });
                  setProducts(await getProducts(id));
                  toast.success('Producto agregado');
                }} className="btn-neon flex items-center gap-2 text-sm">
                  <Plus size={15} /> Agregar producto
                </button>
              </>
            )}

            {agent.mode === 'services' && (
              <>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left" style={{ color: '#6B7280' }}>
                      <th className="pb-2">Nombre</th><th className="pb-2">Categoría</th>
                      <th className="pb-2 text-right">Precio</th><th className="pb-2 text-right">Duración</th><th className="pb-2"></th>
                    </tr></thead>
                    <tbody>
                      {services.map(s => (
                        <tr key={s.id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <td className="py-2.5 font-medium">{s.name}</td>
                          <td className="py-2.5" style={{ color: '#6B7280' }}>{s.category}</td>
                          <td className="py-2.5 text-right">${s.price.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 text-right">{s.durationMinutes} min</td>
                          <td className="py-2.5 text-right">
                            <button onClick={async () => { await deleteService(s.id); setServices(await getServices(id)); toast.success('Servicio eliminado'); }} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {services.length === 0 && <tr><td colSpan={5} className="py-6 text-center" style={{ color: '#6B7280' }}>Sin servicios todavía</td></tr>}
                    </tbody>
                  </table>
                </div>
                <h4 className="font-semibold mb-3 text-sm" style={{ color: '#00D4FF' }}>+ Agregar servicio</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="input-dark" placeholder="Nombre" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
                  <input className="input-dark" placeholder="Categoría" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })} />
                  <input className="input-dark" placeholder="Precio" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
                  <input className="input-dark" placeholder="Duración (min)" type="number" value={newService.durationMinutes} onChange={e => setNewService({ ...newService, durationMinutes: e.target.value })} />
                  <input className="input-dark col-span-2" placeholder="Descripción" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
                </div>
                <button onClick={async () => {
                  if (!newService.name || !newService.price) return;
                  await createService(id, { name: newService.name, description: newService.description, price: Number(newService.price), durationMinutes: Number(newService.durationMinutes), category: newService.category });
                  setNewService({ name: '', description: '', price: '', durationMinutes: '', category: '' });
                  setServices(await getServices(id));
                  toast.success('Servicio agregado');
                }} className="btn-neon flex items-center gap-2 text-sm">
                  <Plus size={15} /> Agregar servicio
                </button>
              </>
            )}
          </div>
        )}

        {/* HORARIOS */}
        {tab === 'Horarios' && (
          <div className="glass-card p-6 flex flex-col gap-6">
            <h3 className="font-bold text-lg">Días y horarios de atención</h3>
            <div>
              <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>DÍAS LABORALES</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => {
                  const active = (form.workingDays ?? agent.workingDays).includes(d.n);
                  return (
                    <button key={d.n}
                      onClick={() => {
                        const current = form.workingDays ?? agent.workingDays;
                        setForm({ ...form, workingDays: active ? current.filter(x => x !== d.n) : [...current, d.n].sort() });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-neon/20 text-cyan-400 border border-cyan-400/40' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'}`}>
                      {d.l}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>HORARIOS DISPONIBLES</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {HOURS.filter((_, i) => i >= 18 && i <= 36).map(h => {
                  const active = (form.workingHours ?? agent.workingHours).includes(h);
                  return (
                    <button key={h}
                      onClick={() => {
                        const current = form.workingHours ?? agent.workingHours;
                        setForm({ ...form, workingHours: active ? current.filter(x => x !== h) : [...current, h].sort() });
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-mono font-semibold transition-all ${active ? 'bg-neon/20 text-cyan-400 border border-cyan-400/40' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'}`}>
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => save({ workingDays: form.workingDays, workingHours: form.workingHours })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>
        )}

        {/* LÍMITES */}
        {tab === 'Límites' && (
          <div className="glass-card p-6 flex flex-col gap-5">
            <h3 className="font-bold text-lg">Control de respuestas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>RESPUESTAS HOY</div>
                <div className="text-3xl font-black" style={{ color: '#00D4FF' }}>{agent.responsesToday}</div>
                {agent.maxResponsesPerDay > 0 && <div className="text-xs mt-1" style={{ color: '#6B7280' }}>de {agent.maxResponsesPerDay}</div>}
              </div>
              <div className="glass-card p-4">
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>RESPUESTAS TOTAL</div>
                <div className="text-3xl font-black" style={{ color: '#7C3AED' }}>{agent.responsesTotal}</div>
                {agent.maxResponsesTotal > 0 && <div className="text-xs mt-1" style={{ color: '#6B7280' }}>de {agent.maxResponsesTotal}</div>}
              </div>
            </div>
            {agent.maxResponsesPerDay > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-2" style={{ color: '#6B7280' }}>
                  <span>Uso diario</span>
                  <span style={{ color: pct >= 90 ? '#EF4444' : '#F0F4FF' }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="progress-bar h-3"><div className="progress-fill h-3" style={{ width: `${pct}%`, background: pct >= 90 ? '#EF4444' : undefined }} /></div>
              </div>
            )}
            {stats?.estimatedCostUSD !== undefined && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <DollarSign size={16} color="#EF4444" />
                <div>
                  <span className="font-bold text-sm" style={{ color: '#EF4444' }}>${stats.estimatedCostUSD.toFixed(3)} USD</span>
                  <span className="text-xs ml-2" style={{ color: '#6B7280' }}>costo estimado acumulado ({stats.model?.split('-')[1]})</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>LÍM. DIARIO (0 = ∞)</label>
                <input className="input-dark" type="number" min={0} value={form.maxResponsesPerDay ?? 0} onChange={e => setForm({ ...form, maxResponsesPerDay: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>LÍM. TOTAL (0 = ∞)</label>
                <input className="input-dark" type="number" min={0} value={form.maxResponsesTotal ?? 0} onChange={e => setForm({ ...form, maxResponsesTotal: Number(e.target.value) })} />
              </div>
            </div>
            <button onClick={() => save({ maxResponsesPerDay: form.maxResponsesPerDay, maxResponsesTotal: form.maxResponsesTotal })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar límites'}
            </button>
          </div>
        )}

        {/* AVANZADO */}
        {tab === 'Avanzado' && (
          <div className="glass-card p-6 flex flex-col gap-5">
            <h3 className="font-bold text-lg">Configuración avanzada</h3>
            <div>
              <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>MODELO DE IA</label>
              <div className="flex flex-col gap-2">
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => setForm({ ...form, model: m.id })}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${form.model === m.id ? 'border-neon' : 'border-white/10 hover:border-white/20'}`}
                    style={{ borderColor: form.model === m.id ? m.color : undefined, background: form.model === m.id ? `${m.color}10` : 'rgba(255,255,255,0.03)' }}>
                    <span className="font-bold text-sm" style={{ color: m.color }}>{m.label}</span>
                    <span className="text-xs badge" style={{ background: `${m.color}20`, color: m.color }}>{m.price}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MAX TOKENS: {form.maxTokens ?? 1024}</label>
              <input type="range" min={256} max={2048} step={128} value={form.maxTokens ?? 1024} onChange={e => setForm({ ...form, maxTokens: Number(e.target.value) })} className="w-full accent-cyan-400" />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7280' }}><span>256 (rápido)</span><span>2048 (detallado)</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MONEDA</label>
                <select className="input-dark" value={form.currency ?? 'ARS'} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>ZONA HORARIA</label>
                <select className="input-dark" value={form.timezone ?? ''} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.split('/').pop()}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => save({ model: form.model, maxTokens: form.maxTokens, currency: form.currency, timezone: form.timezone })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar config'}
            </button>

            <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
              <h4 className="font-bold text-sm mb-2" style={{ color: '#EF4444' }}>⚠ Zona de peligro</h4>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Eliminar el agente borrará todos sus datos, conversaciones y catálogo permanentemente.</p>
              <button onClick={handleDelete} className="flex items-center gap-2 text-sm py-2 px-4 rounded-lg font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Trash2 size={14} /> Eliminar agente
              </button>
            </div>
          </div>
        )}

        {/* PLAYGROUND */}
        {tab === 'Playground' && (
          <div className="glass-card flex flex-col" style={{ height: '600px' }}>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <Character type={agent.character as CharacterType} size={36} isActive />
                <div>
                  <div className="font-semibold text-sm">{agent.name}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>Modo prueba — no se envía a WhatsApp</div>
                </div>
              </div>
              <button onClick={clearPlayground} className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg transition-all hover:bg-white/10" style={{ color: '#6B7280' }}>
                <RotateCcw size={13} /> Limpiar chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {pgLoadingHistory && (
                <div className="flex items-center justify-center py-8">
                  <div className="character-float"><Character type={agent.character as CharacterType} size={50} /></div>
                </div>
              )}

              {!pgLoadingHistory && pgMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                  <Character type={agent.character as CharacterType} size={80} isActive />
                  <div className="text-center">
                    <p className="font-semibold mb-1">{charInfo?.name} está listo para conversar</p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Probá el agente antes de conectarlo a WhatsApp</p>
                  </div>
                </div>
              )}

              {!pgLoadingHistory && pgMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 flex-shrink-0">
                      <Character type={agent.character as CharacterType} size={28} />
                    </div>
                  )}
                  <div className={m.role === 'user' ? 'bubble-user' : 'bubble-agent'} style={{ maxWidth: '75%' }}>
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    {m.ts && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(m.ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User size={14} color="#6B7280" />
                    </div>
                  )}
                </div>
              ))}

              {pgLoading && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-7 h-7 flex-shrink-0">
                    <Character type={agent.character as CharacterType} size={28} isActive />
                  </div>
                  <div className="bubble-agent">
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={pgEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <form onSubmit={e => { e.preventDefault(); sendPlayground(); }} className="flex gap-2">
                <input
                  className="input-dark flex-1"
                  placeholder="Escribí un mensaje de prueba..."
                  value={pgInput}
                  onChange={e => setPgInput(e.target.value)}
                  disabled={pgLoading}
                />
                <button type="submit" disabled={pgLoading || !pgInput.trim()} className="btn-neon px-4 flex items-center gap-2">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
