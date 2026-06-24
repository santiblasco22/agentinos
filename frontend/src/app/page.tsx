'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, checkSetupRequired } from '../lib/api';
import { setToken, isLoggedIn } from '../lib/auth';
import { Bot, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative">
      {/* Animated particles */}
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="glass-card p-8 w-full max-w-md z-10 relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#00D4FF,#7C3AED)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            <Bot size={32} color="white" />
          </div>
          <h1 className="text-4xl font-black tracking-widest neon-text">AGENTINOS</h1>
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
  );
}
