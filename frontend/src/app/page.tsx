'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, checkSetupRequired } from '../lib/api';
import { setToken, isLoggedIn } from '../lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import { Character, type CharacterType } from '../components/characters';

const CHARACTERS: CharacterType[] = ['gaucho','tanguera','asador','futbolero','cientifica','rockero','matera','porteno'];

// Deterministic particles — no Math.random() in render to avoid hydration mismatch
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${((i * 8.33) + 3) % 100}%`,
  size: 4 + (i % 5) * 2,
  duration: `${8 + (i % 5) * 2.5}s`,
  delay: `${(i * 1.3) % 10}s`,
}));

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // El servidor y el primer render del cliente usan el mismo personaje (CHARACTERS[0]);
  // recién después de montar elegimos uno al azar. Así no hay mismatch de hidratación.
  const [randomChar, setRandomChar] = useState<CharacterType>(CHARACTERS[0]);

  useEffect(() => {
    setRandomChar(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]);
  }, []);

  useEffect(() => {
    if (isLoggedIn()) { router.push('/dashboard'); return; }
    checkSetupRequired().then(({ setupRequired }) => {
      if (setupRequired) setIsRegister(true);
    }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isRegister
        ? await register(email, password, name)
        : await login(email, password);
      setToken(res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: '#00D4FF', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: '#7C3AED', transform: 'translate(50%,50%)' }} />
      </div>

      {/* Animated particles */}
      <div className="particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <div key={i} className="particle" style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 z-10 relative w-full max-w-md">
        {/* Floating character above the card */}
        <div className="character-float mb-1">
          <Character type={randomChar} size={100} isActive />
        </div>

        <div className="glass-card p-8 w-full">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-4xl font-black tracking-widest gradient-text">AGENTINOS</h1>
            <p className="text-sm mt-2 text-center" style={{ color: '#6B7280' }}>
              Gestioná tus agentes de WhatsApp con IA
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>NOMBRE</label>
                <input
                  className="input-dark"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>EMAIL</label>
              <input
                className="input-dark"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7280' }}>CONTRASEÑA</label>
              <div className="relative">
                <input
                  className="input-dark pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-center p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-neon mt-2 py-3 text-base" disabled={loading}>
              {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>

            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-sm text-center" style={{ color: '#6B7280' }}>
              {isRegister ? '¿Ya tenés cuenta? Iniciá sesión' : '¿Primera vez? Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
