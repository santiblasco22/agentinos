'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAgent, updateAgent, deleteAgent, getProducts, createProduct, deleteProduct, getServices, createService, deleteService, getAgentStats, type Agent, type Product, type Service, type AgentStats } from '../../../lib/api';
import { isLoggedIn } from '../../../lib/auth';
import Navbar from '../../../components/Navbar';
import { Character, CHARACTER_INFO, type CharacterType } from '../../../components/characters';
import { Save, Trash2, Plus, X, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { toggleAgent } from '../../../lib/api';

const TABS = ['General', 'Catálogo', 'Horarios', 'Límites', 'Avanzado'] as const;
type Tab = typeof TABS[number];

const MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'];
const CURRENCIES = ['ARS', 'USD', 'CLP', 'BRL', 'MXN'];
const TIMEZONES = ['America/Argentina/Buenos_Aires', 'America/Santiago', 'America/Lima', 'America/Bogota', 'America/Mexico_City', 'America/Montevideo'];
const HOURS = Array.from({ length: 24 }, (_, h) => [`${h.toString().padStart(2,'0')}:00`, `${h.toString().padStart(2,'0')}:30`]).flat();
const DAYS = [{ n: 0, l: 'Dom' }, { n: 1, l: 'Lun' }, { n: 2, l: 'Mar' }, { n: 3, l: 'Mié' }, { n: 4, l: 'Jue' }, { n: 5, l: 'Vie' }, { n: 6, l: 'Sáb' }];

export default function AgentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [tab, setTab] = useState<Tab>('General');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // General form state
  const [form, setForm] = useState<Partial<Agent>>({});

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: '' });
  const [newService, setNewService] = useState({ name: '', description: '', price: '', durationMinutes: '', category: '' });

  const load = useCallback(async () => {
    const a = await getAgent(id);
    setAgent(a);
    setForm(a);
    if (a.mode === 'ecommerce') setProducts(await getProducts(id));
    else setServices(await getServices(id));
    setStats(await getAgentStats(id));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    load();
  }, [router, load]);

  const save = async (data: Partial<Agent>) => {
    setSaving(true); setMsg('');
    try {
      const updated = await updateAgent(id, data);
      setAgent(updated);
      setForm(updated);
      setMsg('Guardado ✓');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!agent) return;
    const { isActive } = await toggleAgent(id);
    setAgent({ ...agent, isActive });
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que querés eliminar este agente? Esta acción no se puede deshacer.')) return;
    await deleteAgent(id);
    router.push('/dashboard');
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
        {/* Back */}
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
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold transition-all ${tab === t ? 'tab-active' : 'tab-inactive'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="glass-card p-6">
          {/* GENERAL */}
          {tab === 'General' && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg mb-2">Configuración general</h3>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NOMBRE</label>
                <input className="input-dark" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NÚMERO WHATSAPP</label>
                <input className="input-dark" value={form.whatsappNumber ?? ''} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="whatsapp:+54911..." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>TOKEN MERCADOPAGO</label>
                <input className="input-dark" value={form.mercadopagoToken ?? ''} onChange={e => setForm({ ...form, mercadopagoToken: e.target.value })} type="password" placeholder="APP_USR-..." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>INSTRUCCIONES EXTRAS (prompt personalizado)</label>
                <textarea className="input-dark resize-none" rows={4} value={form.customPrompt ?? ''} onChange={e => setForm({ ...form, customPrompt: e.target.value })} placeholder="Ej: Siempre saludá con '¡Bienvenido!' y ofrecé descuentos en días lluviosos..." />
              </div>
              {msg && <div className="text-sm text-center" style={{ color: msg.includes('Error') ? '#EF4444' : '#10B981' }}>{msg}</div>}
              <button onClick={() => save(form)} disabled={saving} className="btn-neon flex items-center gap-2 self-start mt-2">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}

          {/* CATÁLOGO */}
          {tab === 'Catálogo' && (
            <div>
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
                              <button onClick={async () => { await deleteProduct(p.id); setProducts(await getProducts(id)); }} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
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
                              <button onClick={async () => { await deleteService(s.id); setServices(await getServices(id)); }} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
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
                  }} className="btn-neon flex items-center gap-2 text-sm">
                    <Plus size={15} /> Agregar servicio
                  </button>
                </>
              )}
            </div>
          )}

          {/* HORARIOS */}
          {tab === 'Horarios' && (
            <div className="flex flex-col gap-6">
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
              {msg && <div className="text-sm" style={{ color: msg.includes('Error') ? '#EF4444' : '#10B981' }}>{msg}</div>}
              <button onClick={() => save({ workingDays: form.workingDays, workingHours: form.workingHours })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar horarios'}
              </button>
            </div>
          )}

          {/* LÍMITES */}
          {tab === 'Límites' && (
            <div className="flex flex-col gap-5">
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
              {msg && <div className="text-sm" style={{ color: msg.includes('Error') ? '#EF4444' : '#10B981' }}>{msg}</div>}
              <button onClick={() => save({ maxResponsesPerDay: form.maxResponsesPerDay, maxResponsesTotal: form.maxResponsesTotal })} disabled={saving} className="btn-neon flex items-center gap-2 self-start">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar límites'}
              </button>
            </div>
          )}

          {/* AVANZADO */}
          {tab === 'Avanzado' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-bold text-lg">Configuración avanzada</h3>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MODELO DE IA</label>
                <select className="input-dark" value={form.model ?? 'claude-opus-4-8'} onChange={e => setForm({ ...form, model: e.target.value })}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MAX TOKENS: {form.maxTokens ?? 1024}</label>
                <input type="range" min={256} max={2048} step={128} value={form.maxTokens ?? 1024} onChange={e => setForm({ ...form, maxTokens: Number(e.target.value) })} className="w-full accent-cyan-400" />
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
              {msg && <div className="text-sm" style={{ color: msg.includes('Error') ? '#EF4444' : '#10B981' }}>{msg}</div>}
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
        </div>
      </main>
    </div>
  );
}
