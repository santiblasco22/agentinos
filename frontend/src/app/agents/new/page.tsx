'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAgent } from '../../../lib/api';
import { isLoggedIn } from '../../../lib/auth';
import { useEffect } from 'react';
import { Character, CHARACTER_INFO, type CharacterType } from '../../../components/characters';
import Navbar from '../../../components/Navbar';
import { ShoppingBag, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const CHARACTERS = Object.entries(CHARACTER_INFO) as [CharacterType, typeof CHARACTER_INFO[CharacterType]][];
const COLORS = ['#00D4FF', '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#EC4899'];
const MODELS = [
  { id: 'claude-haiku-4-5', label: 'Haiku', desc: 'Rápido y barato', price: '$1/1M tokens', color: '#10B981' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet', desc: 'Balanceado', price: '$3/1M tokens', color: '#F59E0B' },
  { id: 'claude-opus-4-8', label: 'Opus', desc: 'Más potente', price: '$5/1M tokens', color: '#EF4444' },
];
const CURRENCIES = ['ARS', 'USD', 'CLP', 'BRL', 'MXN'];
const TIMEZONES = [
  'America/Argentina/Buenos_Aires', 'America/Santiago', 'America/Lima',
  'America/Bogota', 'America/Mexico_City', 'America/Montevideo',
];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'ecommerce' | 'services'>('ecommerce');
  const [character, setCharacter] = useState<CharacterType>('gaucho');
  const [color, setColor] = useState(COLORS[0]);

  // Step 2
  const [whatsappNumber, setWhatsappNumber] = useState('+54');
  const [mpToken, setMpToken] = useState('');
  const [model, setModel] = useState('claude-opus-4-8');

  // Step 3
  const [maxPerDay, setMaxPerDay] = useState(0);
  const [maxTotal, setMaxTotal] = useState(0);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [currency, setCurrency] = useState('ARS');
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires');

  useEffect(() => {
    if (!isLoggedIn()) router.push('/');
  }, [router]);

  const next = () => {
    if (step === 1 && !name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setStep(s => Math.min(s + 1, 3));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const agent = await createAgent({
        name: name.trim(), mode, character, color,
        whatsappNumber: whatsappNumber.trim() ? `whatsapp:${whatsappNumber.trim()}` : undefined,
        mercadopagoToken: mpToken.trim(),
        model, currency, timezone,
        maxResponsesPerDay: maxPerDay,
        maxResponsesTotal: maxTotal,
        maxTokens,
      } as any);
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el agente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${s < step ? 'step-done' : s === step ? 'step-active' : 'step-pending'}`}>
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 3 && <div className="w-16 h-px" style={{ background: s < step ? '#00D4FF40' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Identidad del agente</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>NOMBRE DEL AGENTE</label>
                  <input className="input-dark" placeholder="Ej: Asistente de Valentina" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>MODO</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['ecommerce', 'services'] as const).map((m) => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`p-4 rounded-xl border text-left transition-all ${mode === m ? 'border-neon bg-neon/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                        style={{ borderColor: mode === m ? '#00D4FF' : undefined }}>
                        {m === 'ecommerce' ? <ShoppingBag size={24} color={mode === m ? '#00D4FF' : '#6B7280'} className="mb-2" /> : <Calendar size={24} color={mode === m ? '#00D4FF' : '#6B7280'} className="mb-2" />}
                        <div className="font-semibold text-sm">{m === 'ecommerce' ? 'Tienda / E-commerce' : 'Servicios / Turnos'}</div>
                        <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{m === 'ecommerce' ? 'Catálogo, carrito y pagos' : 'Reservas y disponibilidad'}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>PERSONAJE</label>
                  <div className="grid grid-cols-4 gap-3">
                    {CHARACTERS.map(([key, info]) => (
                      <button key={key} onClick={() => setCharacter(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${character === key ? 'border-neon' : 'border-white/10 hover:border-white/20'}`}
                        style={{ borderColor: character === key ? info.color : undefined, background: character === key ? `${info.color}15` : 'rgba(255,255,255,0.03)' }}>
                        <Character type={key} size={48} isActive={character === key} />
                        <span className="text-xs font-medium" style={{ color: character === key ? info.color : '#6B7280' }}>{info.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>COLOR</label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Conexiones</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NÚMERO DE WHATSAPP (Twilio)</label>
                  <input className="input-dark" placeholder="+54911..." value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Formato: +54911XXXXXXXX</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>TOKEN DE MERCADOPAGO (opcional)</label>
                  <input className="input-dark" placeholder="APP_USR-..." value={mpToken} onChange={e => setMpToken(e.target.value)} type="password" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>MODELO DE IA</label>
                  <div className="flex flex-col gap-2">
                    {MODELS.map((m) => (
                      <button key={m.id} onClick={() => setModel(m.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${model === m.id ? 'border-neon' : 'border-white/10 hover:border-white/20'}`}
                        style={{ borderColor: model === m.id ? m.color : undefined, background: model === m.id ? `${m.color}10` : 'rgba(255,255,255,0.03)' }}>
                        <div>
                          <span className="font-bold text-sm" style={{ color: m.color }}>{m.label}</span>
                          <span className="text-xs ml-2" style={{ color: '#6B7280' }}>{m.desc}</span>
                        </div>
                        <span className="text-xs badge" style={{ background: `${m.color}20`, color: m.color }}>{m.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Límites y configuración</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MAX RESPUESTAS POR DÍA (0 = ilimitado)</label>
                  <input className="input-dark" type="number" min={0} max={10000} value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))} />
                  <input type="range" min={0} max={1000} value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))} className="w-full mt-2 accent-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MAX RESPUESTAS EN TOTAL (0 = ilimitado)</label>
                  <input className="input-dark" type="number" min={0} value={maxTotal} onChange={e => setMaxTotal(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MAX TOKENS POR RESPUESTA: {maxTokens}</label>
                  <input type="range" min={256} max={2048} step={128} value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="w-full accent-cyan-400" />
                  <div className="flex justify-between text-xs mt-1" style={{ color: '#6B7280' }}>
                    <span>256 (rápido)</span><span>2048 (detallado)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>MONEDA</label>
                    <select className="input-dark" value={currency} onChange={e => setCurrency(e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>ZONA HORARIA</label>
                    <select className="input-dark" value={timezone} onChange={e => setTimezone(e.target.value)}>
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.split('/').pop()}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 text-sm p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1
              ? <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-2"><ChevronLeft size={16} /> Anterior</button>
              : <button onClick={() => router.push('/dashboard')} className="btn-ghost">Cancelar</button>
            }
            {step < 3
              ? <button onClick={next} className="btn-neon flex items-center gap-2">Siguiente <ChevronRight size={16} /></button>
              : <button onClick={handleSubmit} disabled={loading} className="btn-neon flex items-center gap-2">
                  {loading ? 'Creando...' : <><Check size={16} /> Crear agente</>}
                </button>
            }
          </div>
        </div>
      </main>
    </div>
  );
}
