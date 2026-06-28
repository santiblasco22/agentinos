'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../../lib/auth';
import Navbar from '../../components/Navbar';
import { Check, Zap, Rocket, Building2 } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 'US$19',
    per: '/mes',
    tagline: 'Para probar y arrancar.',
    color: '#10B981',
    features: [
      '1 empleado virtual',
      '1 número de WhatsApp',
      'Base de conocimiento simple',
      'Hasta 500 respuestas/mes',
      'Métricas básicas',
    ],
    cta: 'Empezar',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Rocket,
    price: 'US$49',
    per: '/mes',
    tagline: 'Para un negocio que ya vende.',
    color: '#00D4FF',
    featured: true,
    features: [
      '2 a 3 empleados virtuales',
      'Más respuestas incluidas',
      'Derivación a humano (handoff)',
      'Etiquetas de clientes',
      'Métricas de negocio completas',
      'Integración con Google Sheets',
      'IA Avanzada incluida',
    ],
    cta: 'Elegir Pro',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    price: 'US$99–149',
    per: '/mes',
    tagline: 'Para negocios con equipo.',
    color: '#7C3AED',
    features: [
      'Varios usuarios',
      'Integraciones (Tiendanube, ML, etc.)',
      'Campañas y difusión',
      'CRM simple incluido',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    cta: 'Hablar con ventas',
  },
];

const SETUP = [
  { name: 'Setup básico', price: 'US$50–100', desc: 'Configuración y puesta en marcha del agente.' },
  { name: 'Setup con carga de productos', price: 'US$150–300', desc: 'Cargamos tu catálogo, precios y políticas por vos.' },
  { name: 'Setup con integración', price: 'US$300–800', desc: 'Conectamos Tiendanube, Mercado Libre, Sheets o lo que necesites.' },
];

export default function PlanesPage() {
  const router = useRouter();
  useEffect(() => { if (!isLoggedIn()) router.push('/'); }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Planes <span className="gradient-text">AGENTINOS</span></h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Empleados virtuales de WhatsApp para tu negocio. Precios en USD, se cobran en pesos al cambio del día.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="glass-card p-6 flex flex-col relative"
                style={p.featured ? { borderColor: `${p.color}80`, boxShadow: `0 0 30px ${p.color}25` } : undefined}>
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge text-xs font-bold" style={{ background: p.color, color: '#080B14' }}>
                    MÁS ELEGIDO
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={20} color={p.color} />
                  <h3 className="font-bold text-lg">{p.name}</h3>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{p.tagline}</p>
                <div className="mb-5">
                  <span className="text-3xl font-black" style={{ color: p.color }}>{p.price}</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>{p.per}</span>
                </div>
                <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} color={p.color} className="mt-0.5 flex-shrink-0" />
                      <span style={{ color: '#D1D5DB' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn-neon w-full justify-center"
                  style={p.featured ? undefined : { background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}50` }}>
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-bold text-lg mb-1">Setup inicial (pago único)</h2>
          <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Te dejamos el agente listo para vender. Lo cobramos aparte del plan mensual.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {SETUP.map((s) => (
              <div key={s.name} className="p-4 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="font-semibold text-sm mb-1">{s.name}</div>
                <div className="text-xl font-black mb-1" style={{ color: '#00D4FF' }}>{s.price}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#4B5563' }}>
          Mockup de precios para validar la propuesta — los pagos todavía no están conectados.
        </p>
      </main>
    </div>
  );
}
