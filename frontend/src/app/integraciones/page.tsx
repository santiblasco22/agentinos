'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../../lib/auth';
import Navbar from '../../components/Navbar';
import {
  CreditCard, ShoppingBag, Store, Sheet, CalendarDays, Truck, Mail, Instagram, FileSpreadsheet, Users,
} from 'lucide-react';

type Status = 'disponible' | 'pronto';

const INTEGRATIONS: { name: string; desc: string; icon: typeof CreditCard; color: string; status: Status }[] = [
  { name: 'Mercado Pago',     desc: 'Cobrá señas y ventas con link de pago automático.',      icon: CreditCard,       color: '#00B1EA', status: 'disponible' },
  { name: 'Tiendanube',       desc: 'Sincronizá productos, stock y precios de tu tienda.',    icon: Store,            color: '#2D3EFF', status: 'pronto' },
  { name: 'Mercado Libre',    desc: 'Respondé preguntas y ventas de tus publicaciones.',      icon: ShoppingBag,      color: '#FFE600', status: 'pronto' },
  { name: 'Google Sheets',    desc: 'Volcá pedidos, turnos y leads a una planilla.',          icon: Sheet,            color: '#0F9D58', status: 'pronto' },
  { name: 'Google Calendar',  desc: 'Agendá los turnos directamente en tu calendario.',       icon: CalendarDays,     color: '#4285F4', status: 'pronto' },
  { name: 'Andreani',         desc: 'Cotizá y generá envíos sin salir del chat.',             icon: Truck,            color: '#E2001A', status: 'pronto' },
  { name: 'Correo Argentino', desc: 'Envíos a todo el país desde la conversación.',           icon: Mail,             color: '#0066B3', status: 'pronto' },
  { name: 'Instagram',        desc: 'Atendé los DMs de Instagram con el mismo agente.',       icon: Instagram,        color: '#E1306C', status: 'pronto' },
  { name: 'Excel',            desc: 'Importá tu catálogo desde una planilla de Excel.',       icon: FileSpreadsheet,  color: '#217346', status: 'pronto' },
  { name: 'CRM propio',       desc: 'Etiquetá clientes y seguí leads calientes.',             icon: Users,            color: '#7C3AED', status: 'pronto' },
];

export default function IntegracionesPage() {
  const router = useRouter();
  useEffect(() => { if (!isLoggedIn()) router.push('/'); }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2"><span className="gradient-text">Integraciones</span> argentinas</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Conectá tu negocio con las herramientas que ya usás. Esto es lo que vale oro.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((it) => {
            const Icon = it.icon;
            const disponible = it.status === 'disponible';
            return (
              <div key={it.name} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${it.color}1A`, border: `1px solid ${it.color}40` }}>
                    <Icon size={20} color={it.color} />
                  </div>
                  <span className={`badge text-xs ${disponible ? 'badge-green' : ''}`}
                    style={disponible ? undefined : { background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                    {disponible ? '● Disponible' : 'Próximamente'}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm">{it.name}</div>
                  <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{it.desc}</div>
                </div>
                <button
                  disabled={!disponible}
                  className="mt-1 text-sm py-2 rounded-lg font-semibold transition-all"
                  style={disponible
                    ? { background: `${it.color}20`, color: it.color, border: `1px solid ${it.color}50` }
                    : { background: 'rgba(255,255,255,0.04)', color: '#4B5563', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }}>
                  {disponible ? 'Configurar' : 'Avisame cuando esté'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#4B5563' }}>
          Mockup del catálogo de integraciones — solo Mercado Pago está conectado de verdad (en la config del agente). El resto requiere acuerdos y OAuth con cada plataforma.
        </p>
      </main>
    </div>
  );
}
