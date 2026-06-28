'use client';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../lib/auth';
import { LogOut } from 'lucide-react';

const LINKS = [
  { href: '/dashboard', label: 'Agentes' },
  { href: '/integraciones', label: 'Integraciones' },
  { href: '/planes', label: 'Planes' },
];

interface NavbarProps {
  userName?: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  const initial = userName ? userName[0].toUpperCase() : '';

  return (
    <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-xl font-black tracking-wider gradient-text cursor-pointer" onClick={() => router.push('/dashboard')}>
          AGENTINOS
        </span>
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== '/dashboard' && pathname?.startsWith(l.href));
            return (
              <button key={l.href} onClick={() => router.push(l.href)}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ color: active ? '#00D4FF' : '#9CA3AF', background: active ? 'rgba(0,212,255,0.1)' : 'transparent' }}>
                {l.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userName && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#00D4FF,#7C3AED)', color: '#080B14' }}
            >
              {initial}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: '#9CA3AF' }}>{userName}</span>
          </div>
        )}
        <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
          <LogOut size={15} />
          Salir
        </button>
      </div>
    </nav>
  );
}
