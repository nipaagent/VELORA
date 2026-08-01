import React from 'react';

interface UserAvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showBorder?: boolean;
}

// Map each letter A-Z to a rich theme definition
interface LetterTheme {
  bgGradient: string;
  textColor: string;
  accentBg: string;
  badgeShape: string;
  accentSvg?: React.ReactNode;
  fontFamily?: string;
}

const LETTER_THEMES: Record<string, LetterTheme> = {
  A: {
    bgGradient: 'from-amber-500 via-orange-600 to-red-600',
    textColor: 'text-white font-black',
    accentBg: 'border-amber-300/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <polygon points="20,4 36,36 4,36" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="26" x2="30" y2="26" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  B: {
    bgGradient: 'from-blue-600 via-indigo-600 to-violet-800',
    textColor: 'text-white font-black',
    accentBg: 'border-blue-300/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <circle cx="20" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="27" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  C: {
    bgGradient: 'from-cyan-500 via-teal-600 to-emerald-700',
    textColor: 'text-white font-black',
    accentBg: 'border-cyan-200/40',
    badgeShape: 'rounded-full',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M28 10 A14 14 0 1 0 28 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  D: {
    bgGradient: 'from-indigo-600 via-purple-600 to-pink-700',
    textColor: 'text-white font-black',
    accentBg: 'border-purple-300/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M10 6 H22 A14 14 0 0 1 22 34 H10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  E: {
    bgGradient: 'from-emerald-500 via-green-600 to-teal-800',
    textColor: 'text-white font-black',
    accentBg: 'border-emerald-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <line x1="8" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  F: {
    bgGradient: 'from-rose-500 via-pink-600 to-red-700',
    textColor: 'text-white font-black',
    accentBg: 'border-rose-300/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M12 32 V8 H30 M12 20 H26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  G: {
    bgGradient: 'from-amber-400 via-yellow-500 to-orange-600',
    textColor: 'text-slate-900 font-black',
    accentBg: 'border-amber-100/60',
    badgeShape: 'rounded-full',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
      </svg>
    )
  },
  H: {
    bgGradient: 'from-violet-600 via-purple-700 to-indigo-900',
    textColor: 'text-white font-black',
    accentBg: 'border-purple-300/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <line x1="12" y1="6" x2="12" y2="34" stroke="currentColor" strokeWidth="2.5" />
        <line x1="28" y1="6" x2="28" y2="34" stroke="currentColor" strokeWidth="2.5" />
        <line x1="12" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    )
  },
  I: {
    bgGradient: 'from-sky-500 via-indigo-500 to-blue-700',
    textColor: 'text-white font-black',
    accentBg: 'border-sky-200/40',
    badgeShape: 'rounded-full',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <line x1="20" y1="6" x2="20" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  J: {
    bgGradient: 'from-fuchsia-600 via-purple-600 to-pink-600',
    textColor: 'text-white font-black',
    accentBg: 'border-fuchsia-300/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M26 8 V24 A8 8 0 0 1 10 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  K: {
    bgGradient: 'from-red-500 via-rose-600 to-orange-700',
    textColor: 'text-white font-black',
    accentBg: 'border-red-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <line x1="10" y1="6" x2="10" y2="34" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="20" x2="30" y2="6" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="20" x2="30" y2="34" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  L: {
    bgGradient: 'from-slate-800 via-slate-900 to-black',
    textColor: 'text-amber-400 font-black',
    accentBg: 'border-amber-400/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M12 8 V30 H30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  M: {
    bgGradient: 'from-teal-500 via-emerald-600 to-cyan-800',
    textColor: 'text-white font-black',
    accentBg: 'border-teal-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M8 32 V8 L20 22 L32 8 V32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    )
  },
  N: {
    bgGradient: 'from-indigo-500 via-blue-600 to-cyan-600',
    textColor: 'text-white font-black',
    accentBg: 'border-indigo-200/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M10 32 V8 L30 32 V8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  O: {
    bgGradient: 'from-amber-500 via-orange-500 to-yellow-600',
    textColor: 'text-white font-black',
    accentBg: 'border-amber-200/40',
    badgeShape: 'rounded-full',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    )
  },
  P: {
    bgGradient: 'from-purple-600 via-violet-600 to-fuchsia-800',
    textColor: 'text-white font-black',
    accentBg: 'border-purple-200/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M10 32 V8 H22 A8 8 0 0 1 22 22 H10" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  Q: {
    bgGradient: 'from-pink-500 via-rose-600 to-purple-800',
    textColor: 'text-white font-black',
    accentBg: 'border-pink-200/40',
    badgeShape: 'rounded-full',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <circle cx="20" cy="18" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="22" y1="22" x2="32" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  R: {
    bgGradient: 'from-rose-600 via-red-600 to-amber-600',
    textColor: 'text-white font-black',
    accentBg: 'border-rose-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M10 32 V8 H22 A7 7 0 0 1 22 22 H10 M20 22 L30 32" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  S: {
    bgGradient: 'from-blue-500 via-indigo-600 to-violet-700',
    textColor: 'text-white font-black',
    accentBg: 'border-blue-200/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M28 12 C24 6, 12 8, 14 18 C16 28, 28 26, 24 34 C20 38, 12 34, 10 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  T: {
    bgGradient: 'from-cyan-600 via-blue-600 to-indigo-800',
    textColor: 'text-white font-black',
    accentBg: 'border-cyan-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <line x1="6" y1="10" x2="34" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="10" x2="20" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  U: {
    bgGradient: 'from-orange-500 via-amber-600 to-red-600',
    textColor: 'text-white font-black',
    accentBg: 'border-orange-200/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M10 8 V22 A10 10 0 0 0 30 22 V8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  V: {
    bgGradient: 'from-indigo-600 via-violet-600 to-purple-800',
    textColor: 'text-white font-black',
    accentBg: 'border-indigo-300/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M8 8 L20 32 L32 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  W: {
    bgGradient: 'from-emerald-600 via-teal-600 to-indigo-800',
    textColor: 'text-white font-black',
    accentBg: 'border-emerald-200/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 40 40">
        <path d="M6 8 L13 32 L20 16 L27 32 L34 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  X: {
    bgGradient: 'from-fuchsia-600 via-rose-600 to-indigo-800',
    textColor: 'text-white font-black',
    accentBg: 'border-fuchsia-200/40',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <line x1="8" y1="8" x2="32" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="8" x2="8" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  Y: {
    bgGradient: 'from-yellow-400 via-amber-500 to-orange-600',
    textColor: 'text-slate-900 font-black',
    accentBg: 'border-yellow-100/60',
    badgeShape: 'rounded-2xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M8 8 L20 22 L32 8 M20 22 V34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  Z: {
    bgGradient: 'from-slate-900 via-indigo-950 to-rose-950',
    textColor: 'text-cyan-400 font-black',
    accentBg: 'border-cyan-400/40',
    badgeShape: 'rounded-xl',
    accentSvg: (
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 40 40">
        <path d="M8 10 H32 L8 30 H32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
};

const DEFAULT_THEME: LetterTheme = {
  bgGradient: 'from-indigo-600 via-purple-600 to-slate-800',
  textColor: 'text-white font-black',
  accentBg: 'border-white/30',
  badgeShape: 'rounded-xl'
};

export default function UserAvatar({ name, size = 'md', className = '', showBorder = true }: UserAvatarProps) {
  // Extract clean first letter
  const cleanName = (name || 'User').trim();
  const firstChar = cleanName.charAt(0).toUpperCase();
  const isLetter = /[A-Z]/.test(firstChar);
  const letterKey = isLetter ? firstChar : 'A';
  const theme = LETTER_THEMES[letterKey] || DEFAULT_THEME;

  // Size mapping (Tailwind dimensions & font sizes)
  let sizeClasses = 'w-8 h-8 text-xs';
  let customStyle: React.CSSProperties = {};

  if (typeof size === 'number') {
    customStyle = {
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.round(size * 0.42))}px`
    };
  } else {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-6 h-6 text-[10px]';
        break;
      case 'sm':
        sizeClasses = 'w-7 h-7 text-xs';
        break;
      case 'md':
        sizeClasses = 'w-8 h-8 text-xs sm:text-sm';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12 text-lg sm:text-xl';
        break;
      case 'xl':
        sizeClasses = 'w-16 h-16 text-2xl sm:text-3xl';
        break;
    }
  }

  return (
    <div
      style={customStyle}
      className={`relative inline-flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.bgGradient} ${theme.badgeShape} overflow-hidden shadow-sm transition-all duration-200 select-none ${showBorder ? `border ${theme.accentBg}` : ''} ${sizeClasses} ${className}`}
      title={cleanName}
    >
      {/* Background SVG Motif */}
      {theme.accentSvg}

      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/20 rounded-full blur-xs pointer-events-none" />

      {/* Letter text display */}
      <span className={`relative z-10 tracking-tight drop-shadow-xs font-mono uppercase ${theme.textColor}`}>
        {firstChar}
      </span>
    </div>
  );
}
