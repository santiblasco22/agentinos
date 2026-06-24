'use client';
import { useRouter } from 'next/navigation';
import { clearToken } from '../lib/auth';
import { Bot, LogOut } from 'lucide-react';

interface NavbarProps {
  userName?: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  return (
    <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00D4FF,#7C3AED)' }}>
          <Bot size={20} color="white" />
        </div>
        <span className="text-xl font-black tracking-wider neon-text">AGENTINOS</span>
      </div>
      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {userName}
          </span>
        )}
        <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
          <LogOut size={15} />
          Salir
        </button>
      </div>
    </nav>
  );
}
