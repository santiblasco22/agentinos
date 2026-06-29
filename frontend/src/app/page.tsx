'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, checkSetupRequired } from '../lib/api';
import { setToken, isLoggedIn } from '../lib/auth';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Check, ShieldCheck, Zap, MessageCircle } from 'lucide-react';
import { Character, type CharacterType } from '../components/characters';
import { toast } from '../components/Toaster';

const CHARACTERS: CharacterType[] = ['gaucho','tanguera','asador','futbolero','cientifica','rockero','matera','porteno'];

// Deterministic particles — no Math.random() in render to avoid hydration mismatch
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${((i * 8.33) + 3) % 100}%`,
  size: 4 + (i % 5) * 2,
  duration: `${8 + (i % 5) * 2.5}s`,
  delay: `${(i * 1.3) % 10}s`,
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 0 = vacío, 1 débil, 2 media, 3 fuerte, 4 muy fuerte
function passwordScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH = [
  { label: '', color: 'transparent' },
  { label: 'Débil', color: '#EF4444' },
  { label: 'Media', color: '#F59E0B' },
  { label: 'Fuerte', color: '#10B981' },
  { label: 'Muy fuerte', color: '#00D4FF' },
];

const FEATURES = [
  { icon: MessageCircle, text: 'Agentes de WhatsApp con IA, listos en minutos' },
  { icon: Zap, text: 'Catálogo, pagos y turnos automáticos' },
  { icon: ShieldCheck, text: 'Control total: límites, modelos y personalidad' },
];

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);

  // Campos
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [randomChar] = useState<CharacterType>(() => CHARACTERS[0]);

  useEffect(() => {
    if (isLoggedIn()) { router.push('/dashboard'); return; }
    checkSetupRequired().then(({ setupRequired }) => {
      if (setupRequired) setMode('register');
    }).catch(() => {});
  }, [router]);

  const switchMode = (m: Mode) => { setMode(m); setErrors({}); };

  const score = passwordScore(password);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresá un email válido';
    if (!password) e.password = 'Ingresá tu contraseña';
    if (mode === 'register') {
      if (!name.trim()) e.name = 'El nombre es requerido';
      if (password && password.length < 8) e.password = 'Mínimo 8 caracteres';
      if (confirm !== password) e.confirm = 'Las contraseñas no coinciden';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = mode === 'register'
        ? await register({ name: name.trim(), email: email.trim(), password, company: company.trim() || undefined, phone: phone.trim() || undefined })
        : await login(email.trim(), password);
      setToken(res.token);
      toast.success(mode === 'register' ? `¡Bienvenido, ${res.user.name.split(' ')[0]}!` : 'Sesión iniciada');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      // Mapear errores conocidos a campos
      if (/email ya está registrado/i.test(message)) setErrors({ email: message });
      else if (/credenciales/i.test(message)) setErrors({ password: 'Email o contraseña incorrectos' });
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen gradient-bg flex relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#00D4FF', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: '#7C3AED', transform: 'translate(50%,50%)' }} />
      </div>

      {/* Animated particles */}
      <div className="particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <div key={i} className="particle" style={{ left: p.left, width: `${p.size}px`, height: `${p.size}px`, animationDuration: p.duration, animationDelay: p.delay }} />
        ))}
      </div>

      {/* ── Panel de branding (izquierda, oculto en mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] xl:w-[40%] p-12 relative z-10 border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <Character type={randomChar} size={56} isActive />
          <span className="text-2xl font-black tracking-widest gradient-text">AGENTINOS</span>
        </div>

        <div className="flex flex-col gap-8 max-w-md">
          <div>
            <h2 className="text-3xl xl:text-4xl font-black leading-tight mb-3" style={{ color: '#F0F4FF' }}>
              Tus clientes atendidos<br /><span className="gradient-text">24/7 por WhatsApp</span>
            </h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Creá, configurá y desplegá agentes de IA con personalidad propia. Sin código.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.12)' }}>
                  <Icon size={17} color="#00D4FF" />
                </div>
                <span className="text-sm" style={{ color: '#D1D5DB' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: '#4B5563' }}>© {new Date().getFullYear()} Agentinos · Hecho en Argentina 🇦🇷</p>
      </div>

      {/* ── Panel del formulario (derecha) ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex lg:hidden flex-col items-center mb-6">
            <div className="mb-2">
              <Character type={randomChar} size={72} isActive />
            </div>
            <span className="text-2xl font-black tracking-widest gradient-text">AGENTINOS</span>
          </div>

          <div className="glass-card p-7 sm:p-8">
            {/* Toggle login / registro */}
            <div className="flex p-1 rounded-xl mb-7" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={mode === m
                    ? { background: 'linear-gradient(135deg,#00D4FF,#0096B4)', color: '#080B14' }
                    : { color: '#9CA3AF' }}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#F0F4FF' }}>
                {isRegister ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                {isRegister ? 'Empezá a gestionar tus agentes en minutos' : 'Ingresá para administrar tus agentes'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {isRegister && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre completo" icon={User} error={errors.name}>
                    <input className="input-dark pl-10" placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </Field>
                  <Field label="Empresa" hint="opcional" icon={Building2}>
                    <input className="input-dark pl-10" placeholder="Mi Negocio" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
                  </Field>
                </div>
              )}

              <Field label="Email" icon={Mail} error={errors.email}>
                <input className="input-dark pl-10" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>

              {isRegister && (
                <Field label="Teléfono" hint="opcional" icon={Phone}>
                  <input className="input-dark pl-10" type="tel" placeholder="+54 9 11 ..." value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                </Field>
              )}

              <Field label="Contraseña" icon={Lock} error={errors.password}>
                <input
                  className="input-dark pl-10 pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} tabIndex={-1}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              {/* Medidor de fuerza */}
              {isRegister && password.length > 0 && (
                <div className="-mt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i <= score ? STRENGTH[score].color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className="text-xs mt-1 inline-block" style={{ color: STRENGTH[score].color }}>{STRENGTH[score].label}</span>
                </div>
              )}

              {isRegister && (
                <Field label="Confirmar contraseña" icon={Lock} error={errors.confirm}>
                  <input
                    className="input-dark pl-10 pr-10"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Repetí la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirm.length > 0 && confirm === password && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2"><Check size={16} color="#10B981" /></span>
                  )}
                </Field>
              )}

              <button type="submit" className="btn-neon mt-2 py-3 text-base" disabled={loading}>
                {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="text-sm text-center mt-5" style={{ color: '#6B7280' }}>
              {isRegister ? '¿Ya tenés cuenta?' : '¿Primera vez en Agentinos?'}{' '}
              <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')} className="font-semibold gradient-text">
                {isRegister ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campo reutilizable con ícono, label, hint y error ──
function Field({
  label, hint, icon: Icon, error, children,
}: {
  label: string;
  hint?: string;
  icon: typeof Mail;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>
        <span className="uppercase tracking-wide">{label}</span>
        {hint && <span style={{ color: '#4B5563', textTransform: 'none', fontWeight: 400 }}>{hint}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: error ? '#EF4444' : '#6B7280' }}>
          <Icon size={16} />
        </span>
        {children}
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}
