'use client';

export type CharacterType = 'gaucho' | 'tanguera' | 'asador' | 'futbolero' | 'cientifica' | 'rockero' | 'matera' | 'porteno' | 'inmobiliario';

interface CharacterProps {
  size?: number;
  isActive?: boolean;
  isOnline?: boolean;
  className?: string;
}

export const CHARACTER_INFO: Record<CharacterType, { name: string; description: string; color: string }> = {
  gaucho:    { name: 'El Gaucho',      description: 'Directo y confiable',      color: '#DC2626' },
  tanguera:  { name: 'La Tanguera',    description: 'Elegante y sofisticada',   color: '#7C3AED' },
  asador:    { name: 'El Asador',      description: 'Cálido y amigable',        color: '#EA580C' },
  futbolero: { name: 'El Futbolero',   description: 'Entusiasta del equipo',    color: '#1D4ED8' },
  cientifica:{ name: 'La Científica',  description: 'Precisa y analítica',      color: '#059669' },
  rockero:   { name: 'El Rockero',     description: 'Cool y alternativo',       color: '#4C1D95' },
  matera:    { name: 'La Matera',      description: 'Tranquila y tradicional',  color: '#0F766E' },
  porteno:   { name: 'El Porteño',     description: 'Formal y profesional',     color: '#1E3A5F' },
  inmobiliario:{ name: 'El Inmobiliario', description: 'Propiedades y visitas',  color: '#0EA5E9' },
};

// Shared base robot SVG builder
function RobotBase({
  size = 100,
  primaryColor,
  accentColor,
  eyeColor,
  isActive,
  children,
}: {
  size: number;
  primaryColor: string;
  accentColor: string;
  eyeColor: string;
  isActive?: boolean;
  children?: React.ReactNode;
}) {
  const floatClass = isActive ? 'character-float-fast' : 'character-float';
  const height = Math.round(size * 1.2);
  return (
    <div className={floatClass} style={{ width: size, height, display: 'inline-block' }}>
      <svg viewBox="0 0 100 120" width={size} height={height} xmlns="http://www.w3.org/2000/svg">
        {/* Shadow */}
        <ellipse cx="50" cy="115" rx="22" ry="5" fill="rgba(0,0,0,0.3)" />
        {/* Body */}
        <rect x="22" y="62" width="56" height="48" rx="10" fill={primaryColor} />
        {/* Body accent panel */}
        <rect x="32" y="72" width="36" height="20" rx="6" fill={`${accentColor}22`} stroke={accentColor} strokeWidth="1" />
        {/* Power dot */}
        <circle cx="50" cy="82" r="4" fill={accentColor} opacity="0.9" />
        {/* Arms */}
        <rect x="10" y="65" width="12" height="28" rx="6" fill={primaryColor} />
        <rect x="78" y="65" width="12" height="28" rx="6" fill={primaryColor} />
        {/* Hands */}
        <circle cx="16" cy="95" r="6" fill={`${primaryColor}cc`} />
        <circle cx="84" cy="95" r="6" fill={`${primaryColor}cc`} />
        {/* Neck */}
        <rect x="40" y="58" width="20" height="8" rx="3" fill={`${primaryColor}aa`} />
        {/* Head */}
        <rect x="12" y="12" width="76" height="50" rx="16" fill={primaryColor} />
        {/* Head shine */}
        <ellipse cx="35" cy="22" rx="12" ry="5" fill="rgba(255,255,255,0.08)" />
        {/* Ears */}
        <circle cx="12" cy="37" r="5" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
        <circle cx="88" cy="37" r="5" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
        {/* Left eye white */}
        <ellipse cx="33" cy="35" rx="10" ry="11" fill="white" />
        {/* Left iris */}
        <ellipse className="character-blink" cx="33" cy="35" rx="7" ry="8" fill={eyeColor} style={{ transformOrigin: '33px 35px' }} />
        {/* Left pupil */}
        <ellipse cx="34" cy="35" rx="4" ry="4.5" fill="#111" />
        {/* Left highlight */}
        <ellipse cx="36" cy="31" rx="2" ry="2" fill="white" opacity="0.8" />
        {/* Right eye white */}
        <ellipse cx="67" cy="35" rx="10" ry="11" fill="white" />
        {/* Right iris */}
        <ellipse className="character-blink" cx="67" cy="35" rx="7" ry="8" fill={eyeColor} style={{ transformOrigin: '67px 35px' }} />
        {/* Right pupil */}
        <ellipse cx="68" cy="35" rx="4" ry="4.5" fill="#111" />
        {/* Right highlight */}
        <ellipse cx="70" cy="31" rx="2" ry="2" fill="white" opacity="0.8" />
        {/* Antenna base */}
        <line x1="50" y1="12" x2="50" y2="4" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
        {/* Antenna tip */}
        <circle cx="50" cy="3" r="4" fill={accentColor} className={isActive ? 'antenna-pulse' : ''} />
        {/* Mouth */}
        <path d="M 38 52 Q 50 58 62 52" stroke={accentColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Character-specific elements */}
        {children}
      </svg>
    </div>
  );
}

function GauchoCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#DC2626" accentColor="#FCD34D" eyeColor="#FCD34D" isActive={isActive}>
      {/* Cowboy hat brim */}
      <ellipse cx="50" cy="14" rx="38" ry="6" fill="#7C2D12" />
      {/* Hat top */}
      <rect x="22" y="-6" width="56" height="20" rx="6" fill="#92400E" />
      {/* Hat band */}
      <rect x="22" y="10" width="56" height="4" fill="#FCD34D" />
      {/* Mustache left */}
      <path d="M 33 54 Q 40 58 44 54" stroke="#7C2D12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Mustache right */}
      <path d="M 56 54 Q 60 58 67 54" stroke="#7C2D12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </RobotBase>
  );
}

function TangueraCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#7C3AED" accentColor="#F472B6" eyeColor="#F472B6" isActive={isActive}>
      {/* Eyelashes left */}
      <line x1="26" y1="26" x2="24" y2="22" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="24" x2="29" y2="20" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="24" x2="34" y2="20" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      {/* Eyelashes right */}
      <line x1="60" y1="26" x2="58" y2="22" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="24" x2="63" y2="20" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="68" y1="24" x2="68" y2="20" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
      {/* Rose on head */}
      <circle cx="80" cy="20" r="6" fill="#EF4444" />
      <circle cx="77" cy="17" r="4" fill="#DC2626" />
      <ellipse cx="84" cy="24" rx="3" ry="5" fill="#16A34A" transform="rotate(-30 84 24)" />
      {/* Fan (right hand) */}
      <path d="M 78 88 L 88 78 L 92 85 L 84 92 Z" fill="#F472B6" opacity="0.8" />
      <line x1="78" y1="88" x2="88" y2="78" stroke="#7C3AED" strokeWidth="1" />
      <line x1="80" y1="91" x2="91" y2="82" stroke="#7C3AED" strokeWidth="1" />
    </RobotBase>
  );
}

function AsadorCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#EA580C" accentColor="#FCD34D" eyeColor="#FDE68A" isActive={isActive}>
      {/* Chef hat */}
      <rect x="26" y="-8" width="48" height="22" rx="8" fill="white" />
      <rect x="20" y="10" width="60" height="6" rx="3" fill="white" />
      {/* Flame on chest */}
      <path d="M 44 74 Q 46 68 50 72 Q 52 66 56 72 Q 58 68 58 74 Q 56 80 50 82 Q 44 80 44 74" fill="#FCD34D" opacity="0.9" />
      <path d="M 46 76 Q 48 72 50 74 Q 52 72 54 76 Q 52 80 50 81 Q 48 80 46 76" fill="#EF4444" opacity="0.8" />
    </RobotBase>
  );
}

function FutboleroCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#1D4ED8" accentColor="#60A5FA" eyeColor="#60A5FA" isActive={isActive}>
      {/* Jersey stripes */}
      <rect x="32" y="62" width="6" height="48" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="46" y="62" width="6" height="48" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="62" y="62" width="6" height="48" rx="3" fill="rgba(255,255,255,0.15)" />
      {/* Soccer ball on chest */}
      <circle cx="50" cy="82" r="8" fill="white" />
      <path d="M 50 74 L 52 78 L 50 82 L 48 78 Z" fill="#111" />
      <path d="M 42 82 L 46 80 L 50 82 L 46 84 Z" fill="#111" />
      <path d="M 58 82 L 54 80 L 50 82 L 54 84 Z" fill="#111" />
      <circle cx="50" cy="82" r="8" fill="none" stroke="#1D4ED8" strokeWidth="1" />
    </RobotBase>
  );
}

function CientificaCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#059669" accentColor="#6EE7B7" eyeColor="#6EE7B7" isActive={isActive}>
      {/* Glasses left */}
      <circle cx="33" cy="35" r="12" fill="none" stroke="#6EE7B7" strokeWidth="2.5" />
      {/* Glasses right */}
      <circle cx="67" cy="35" r="12" fill="none" stroke="#6EE7B7" strokeWidth="2.5" />
      {/* Glasses bridge */}
      <line x1="45" y1="35" x2="55" y2="35" stroke="#6EE7B7" strokeWidth="2" />
      {/* Glasses arms */}
      <line x1="21" y1="35" x2="15" y2="33" stroke="#6EE7B7" strokeWidth="2" />
      <line x1="79" y1="35" x2="85" y2="33" stroke="#6EE7B7" strokeWidth="2" />
      {/* DNA helix on chest */}
      <path d="M 40 70 Q 45 73 40 76 Q 45 79 40 82 Q 45 85 40 88" stroke="#6EE7B7" strokeWidth="1.5" fill="none" />
      <path d="M 60 70 Q 55 73 60 76 Q 55 79 60 82 Q 55 85 60 88" stroke="#6EE7B7" strokeWidth="1.5" fill="none" />
      <line x1="40" y1="70" x2="60" y2="70" stroke="#6EE7B7" strokeWidth="1" opacity="0.5" />
      <line x1="40" y1="76" x2="60" y2="76" stroke="#6EE7B7" strokeWidth="1" opacity="0.5" />
      <line x1="40" y1="82" x2="60" y2="82" stroke="#6EE7B7" strokeWidth="1" opacity="0.5" />
      <line x1="40" y1="88" x2="60" y2="88" stroke="#6EE7B7" strokeWidth="1" opacity="0.5" />
    </RobotBase>
  );
}

function RockeroCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#4C1D95" accentColor="#A78BFA" eyeColor="#C4B5FD" isActive={isActive}>
      {/* Lightning mohawk */}
      <path d="M 46 12 L 40 -4 L 52 2 L 46 -10 L 60 0 L 50 4 L 58 -2 L 50 12" fill="#A78BFA" />
      {/* Guitar pick on chest */}
      <path d="M 50 74 L 58 80 L 50 90 L 42 80 Z" fill="#A78BFA" opacity="0.8" />
      <circle cx="50" cy="80" r="3" fill="#4C1D95" />
      {/* Stars on arms */}
      <text x="8" y="84" fontSize="8" fill="#A78BFA">★</text>
      <text x="82" y="84" fontSize="8" fill="#A78BFA">★</text>
    </RobotBase>
  );
}

function MateraCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#0F766E" accentColor="#F59E0B" eyeColor="#FCD34D" isActive={isActive}>
      {/* Mate cup (left hand area) */}
      <rect x="4" y="88" width="14" height="14" rx="4" fill="#78350F" />
      <rect x="5" y="86" width="12" height="4" rx="2" fill="#92400E" />
      {/* Straw */}
      <line x1="11" y1="88" x2="8" y2="70" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="7" cy="69" r="2" fill="#065F46" />
      {/* Steam dots */}
      <circle cx="11" cy="84" r="1.5" fill="#F59E0B" opacity="0.6" />
      <circle cx="8" cy="80" r="1" fill="#F59E0B" opacity="0.4" />
      {/* Warm smile override */}
      <path d="M 35 52 Q 50 60 65 52" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
    </RobotBase>
  );
}

function PortenoCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#1E3A5F" accentColor="#74ACDF" eyeColor="#93C5FD" isActive={isActive}>
      {/* Bow tie */}
      <path d="M 42 60 L 50 56 L 58 60 L 50 64 Z" fill="#74ACDF" />
      <circle cx="50" cy="60" r="2.5" fill="#1E3A5F" />
      {/* Suit lapels */}
      <path d="M 22 65 L 38 72 L 38 110 L 22 110 Z" fill={`#152B47`} />
      <path d="M 78 65 L 62 72 L 62 110 L 78 110 Z" fill={`#152B47`} />
      {/* Pocket square */}
      <rect x="52" y="72" width="10" height="8" rx="2" fill="#74ACDF" opacity="0.8" />
      <path d="M 52 72 L 57 68 L 62 72" fill="#93C5FD" opacity="0.9" />
    </RobotBase>
  );
}

function InmobiliarioCharacter({ size, isActive }: CharacterProps) {
  return (
    <RobotBase size={size ?? 100} primaryColor="#0EA5E9" accentColor="#FBBF24" eyeColor="#7DD3FC" isActive={isActive}>
      {/* Corbata */}
      <path d="M 47 58 L 53 58 L 51 66 L 49 66 Z" fill="#0C4A6E" />
      <path d="M 49 66 L 51 66 L 53 80 L 50 84 L 47 80 Z" fill="#0C4A6E" />
      {/* Solapas del saco */}
      <path d="M 24 64 L 40 70 L 38 96 L 24 96 Z" fill="#075985" />
      <path d="M 76 64 L 60 70 L 62 96 L 76 96 Z" fill="#075985" />
      {/* Casita en el pecho (llavero) */}
      <rect x="44" y="84" width="12" height="9" rx="1" fill="#FBBF24" />
      <path d="M 43 84 L 50 78 L 57 84 Z" fill="#F59E0B" />
      <rect x="48.5" y="87" width="3" height="6" fill="#0C4A6E" />
      {/* Llave en la mano derecha */}
      <circle cx="86" cy="92" r="3" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
      <line x1="86" y1="95" x2="86" y2="101" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="86" y1="99" x2="89" y2="99" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
    </RobotBase>
  );
}

const COMPONENTS: Record<CharacterType, React.FC<CharacterProps>> = {
  gaucho: GauchoCharacter,
  tanguera: TangueraCharacter,
  asador: AsadorCharacter,
  futbolero: FutboleroCharacter,
  cientifica: CientificaCharacter,
  rockero: RockeroCharacter,
  matera: MateraCharacter,
  porteno: PortenoCharacter,
  inmobiliario: InmobiliarioCharacter,
};

const PNG_CHARACTERS = new Set<CharacterType>();

function PngCharacter({ type, size = 100, isActive }: { type: CharacterType } & CharacterProps) {
  return (
    <div className="character-png-wrap" style={{ width: size, height: Math.round(size * 1.2) }}>
      <img
        src={`/characters/${type}.png`}
        alt={CHARACTER_INFO[type].name}
        width={size}
        height={size}
        className={isActive ? 'character-png-active' : 'character-png'}
        style={{ objectFit: 'contain', width: size, height: size }}
      />
      <div className={isActive ? 'character-png-shadow-active' : 'character-png-shadow'} />
    </div>
  );
}

export function Character({ type, ...props }: { type: CharacterType } & CharacterProps) {
  if (PNG_CHARACTERS.has(type)) return <PngCharacter type={type} {...props} />;
  const Comp = COMPONENTS[type] ?? GauchoCharacter;
  return <Comp {...props} />;
}
