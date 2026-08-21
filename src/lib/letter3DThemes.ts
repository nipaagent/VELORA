import React from 'react';

export interface Letter3DTheme {
  bgGradient: string;
  badgeBorder: string;
  badgeShape: string;
  textStart: string;
  textEnd: string;
  textMid?: string;
  sideShadow: string;
  glowColor: string;
  ringColor: string;
  description: string;
}

export const LETTER_3D_THEMES: Record<string, Letter3DTheme> = {
  A: {
    bgGradient: 'from-slate-950 via-amber-950 to-slate-900',
    badgeBorder: 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FDE047',
    textMid: '#F59E0B',
    textEnd: '#B45309',
    sideShadow: '#78350F',
    glowColor: '#F59E0B',
    ringColor: '#FEF08A',
    description: '3D Golden Amber Emblem'
  },
  B: {
    bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
    badgeBorder: 'border-blue-400/60 shadow-[0_0_15px_rgba(96,165,250,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#93C5FD',
    textMid: '#3B82F6',
    textEnd: '#1D4ED8',
    sideShadow: '#1E3A8A',
    glowColor: '#3B82F6',
    ringColor: '#BFDBFE',
    description: '3D Royal Sapphire Badge'
  },
  C: {
    bgGradient: 'from-slate-950 via-emerald-950 to-teal-950',
    badgeBorder: 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#A7F3D0',
    textMid: '#10B981',
    textEnd: '#047857',
    sideShadow: '#064E3B',
    glowColor: '#10B981',
    ringColor: '#D1FAE5',
    description: '3D Cyber Emerald Emblem'
  },
  D: {
    bgGradient: 'from-slate-950 via-purple-950 to-fuchsia-950',
    badgeBorder: 'border-purple-400/60 shadow-[0_0_15px_rgba(192,132,252,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#E9D5FF',
    textMid: '#A855F7',
    textEnd: '#7E22CE',
    sideShadow: '#581C87',
    glowColor: '#A855F7',
    ringColor: '#F3E8FF',
    description: '3D Diamond Purple Badge'
  },
  E: {
    bgGradient: 'from-slate-950 via-lime-950 to-emerald-950',
    badgeBorder: 'border-lime-400/60 shadow-[0_0_15px_rgba(163,230,53,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#ECFCCB',
    textMid: '#84CC16',
    textEnd: '#4D7C0F',
    sideShadow: '#365314',
    glowColor: '#84CC16',
    ringColor: '#F7FEE7',
    description: '3D Electric Lime Emblem'
  },
  F: {
    bgGradient: 'from-slate-950 via-rose-950 to-red-950',
    badgeBorder: 'border-rose-400/60 shadow-[0_0_15px_rgba(251,113,133,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FECDD3',
    textMid: '#F43F5E',
    textEnd: '#BE123C',
    sideShadow: '#881337',
    glowColor: '#F43F5E',
    ringColor: '#FFE4E6',
    description: '3D Flame Crimson Emblem'
  },
  G: {
    bgGradient: 'from-slate-950 via-amber-950 to-yellow-950',
    badgeBorder: 'border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FEF08A',
    textMid: '#EAB308',
    textEnd: '#A16207',
    sideShadow: '#713F12',
    glowColor: '#EAB308',
    ringColor: '#FEF9C3',
    description: '3D Galaxy Gold Badge'
  },
  H: {
    bgGradient: 'from-slate-950 via-sky-950 to-blue-950',
    badgeBorder: 'border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#BAE6FD',
    textMid: '#0EA5E9',
    textEnd: '#0369A1',
    sideShadow: '#075985',
    glowColor: '#0EA5E9',
    ringColor: '#E0F2FE',
    description: '3D Holographic Ice Badge'
  },
  I: {
    bgGradient: 'from-slate-950 via-indigo-950 to-violet-950',
    badgeBorder: 'border-indigo-400/60 shadow-[0_0_15px_rgba(129,140,248,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#C7D2FE',
    textMid: '#6366F1',
    textEnd: '#4338CA',
    sideShadow: '#312E81',
    glowColor: '#6366F1',
    ringColor: '#E0E7FF',
    description: '3D Indigo Crystal Emblem'
  },
  J: {
    bgGradient: 'from-slate-950 via-teal-950 to-emerald-950',
    badgeBorder: 'border-teal-400/60 shadow-[0_0_15px_rgba(45,212,191,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#99F6E4',
    textMid: '#14B8A6',
    textEnd: '#0F766E',
    sideShadow: '#134E4A',
    glowColor: '#14B8A6',
    ringColor: '#CCFBF1',
    description: '3D Jade Copper Badge'
  },
  K: {
    bgGradient: 'from-slate-950 via-cyan-950 to-slate-900',
    badgeBorder: 'border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#A5F3FC',
    textMid: '#06B6D4',
    textEnd: '#0E7490',
    sideShadow: '#164E63',
    glowColor: '#06B6D4',
    ringColor: '#CFFAFE',
    description: '3D Knight Platinum Badge'
  },
  L: {
    bgGradient: 'from-slate-950 via-orange-950 to-amber-950',
    badgeBorder: 'border-orange-400/60 shadow-[0_0_15px_rgba(251,146,60,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FFEDD5',
    textMid: '#F97316',
    textEnd: '#C2410C',
    sideShadow: '#7C2D12',
    glowColor: '#F97316',
    ringColor: '#FFEDD5',
    description: '3D Luxury Amber Emblem'
  },
  M: {
    bgGradient: 'from-slate-950 via-fuchsia-950 to-pink-950',
    badgeBorder: 'border-fuchsia-400/60 shadow-[0_0_15px_rgba(232,121,249,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#F5D0FE',
    textMid: '#D946EF',
    textEnd: '#A21CAF',
    sideShadow: '#701A75',
    glowColor: '#D946EF',
    ringColor: '#FAE8FF',
    description: '3D Magenta Cyber Badge'
  },
  N: {
    bgGradient: 'from-slate-950 via-blue-950 to-cyan-950',
    badgeBorder: 'border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#67E8F9',
    textMid: '#0284C7',
    textEnd: '#0369A1',
    sideShadow: '#0C4A6E',
    glowColor: '#38BDF8',
    ringColor: '#BAE6FD',
    description: '3D Neon Cyber Emblem'
  },
  O: {
    bgGradient: 'from-slate-950 via-amber-950 to-red-950',
    badgeBorder: 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FDE68A',
    textMid: '#F59E0B',
    textEnd: '#D97706',
    sideShadow: '#78350F',
    glowColor: '#F59E0B',
    ringColor: '#FEF3C7',
    description: '3D Orbital Sun Badge'
  },
  P: {
    bgGradient: 'from-slate-950 via-purple-950 to-indigo-950',
    badgeBorder: 'border-violet-400/60 shadow-[0_0_15px_rgba(167,139,250,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#DDD6FE',
    textMid: '#8B5CF6',
    textEnd: '#6D28D9',
    sideShadow: '#4C1D95',
    glowColor: '#8B5CF6',
    ringColor: '#EDE9FE',
    description: '3D Platinum Pearl Badge'
  },
  Q: {
    bgGradient: 'from-slate-950 via-rose-950 to-purple-950',
    badgeBorder: 'border-rose-300/60 shadow-[0_0_15px_rgba(253,164,175,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FFE4E6',
    textMid: '#FB7185',
    textEnd: '#E11D48',
    sideShadow: '#881337',
    glowColor: '#FB7185',
    ringColor: '#FFF1F2',
    description: '3D Quartz Rose Gold Emblem'
  },
  R: {
    bgGradient: 'from-slate-950 via-red-950 to-rose-950',
    badgeBorder: 'border-red-400/60 shadow-[0_0_15px_rgba(248,113,113,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FCA5A5',
    textMid: '#EF4444',
    textEnd: '#B91C1C',
    sideShadow: '#7F1D1D',
    glowColor: '#EF4444',
    ringColor: '#FEE2E2',
    description: '3D Ruby Fire Emblem'
  },
  S: {
    bgGradient: 'from-slate-950 via-indigo-950 to-amber-950',
    badgeBorder: 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FEF08A',
    textMid: '#F59E0B',
    textEnd: '#B45309',
    sideShadow: '#451A03',
    glowColor: '#F59E0B',
    ringColor: '#FEF9C3',
    description: '3D Starry Gold Emblem'
  },
  T: {
    bgGradient: 'from-slate-950 via-sky-950 to-slate-900',
    badgeBorder: 'border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#E0F2FE',
    textMid: '#38BDF8',
    textEnd: '#0284C7',
    sideShadow: '#0B4F6C',
    glowColor: '#38BDF8',
    ringColor: '#F0F9FF',
    description: '3D Titanium Cyan Badge'
  },
  U: {
    bgGradient: 'from-slate-950 via-violet-950 to-fuchsia-950',
    badgeBorder: 'border-violet-400/60 shadow-[0_0_15px_rgba(167,139,250,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#C084FC',
    textMid: '#9333EA',
    textEnd: '#6B21A8',
    sideShadow: '#3B0764',
    glowColor: '#A855F7',
    ringColor: '#F3E8FF',
    description: '3D Ultra Violet Glass Badge'
  },
  V: {
    bgGradient: 'from-slate-950 via-emerald-950 to-lime-950',
    badgeBorder: 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#6EE7B7',
    textMid: '#10B981',
    textEnd: '#047857',
    sideShadow: '#022C22',
    glowColor: '#34D399',
    ringColor: '#D1FAE5',
    description: '3D Viper Neon Green Emblem'
  },
  W: {
    bgGradient: 'from-slate-950 via-blue-950 to-teal-950',
    badgeBorder: 'border-blue-400/60 shadow-[0_0_15px_rgba(96,165,250,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#93C5FD',
    textMid: '#2563EB',
    textEnd: '#1E40AF',
    sideShadow: '#172554',
    glowColor: '#3B82F6',
    ringColor: '#DBEAFE',
    description: '3D Wave Sapphire Badge'
  },
  X: {
    bgGradient: 'from-slate-950 via-purple-950 to-amber-950',
    badgeBorder: 'border-purple-400/60 shadow-[0_0_15px_rgba(192,132,252,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#F3E8FF',
    textMid: '#C084FC',
    textEnd: '#7E22CE',
    sideShadow: '#4C1D95',
    glowColor: '#C084FC',
    ringColor: '#FAF5FF',
    description: '3D Xenon Purple Gold Badge'
  },
  Y: {
    bgGradient: 'from-slate-950 via-amber-950 to-orange-950',
    badgeBorder: 'border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#FEF08A',
    textMid: '#FACC15',
    textEnd: '#CA8A04',
    sideShadow: '#713F12',
    glowColor: '#FACC15',
    ringColor: '#FEF9C3',
    description: '3D Sunburst Gold Emblem'
  },
  Z: {
    bgGradient: 'from-slate-950 via-cyan-950 to-indigo-950',
    badgeBorder: 'border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    badgeShape: 'rounded-2xl',
    textStart: '#A5F3FC',
    textMid: '#06B6D4',
    textEnd: '#0891B2',
    sideShadow: '#155E75',
    glowColor: '#22D3EE',
    ringColor: '#ECFEFF',
    description: '3D Zenith Cyber Emblem'
  }
};

export const DEFAULT_3D_THEME: Letter3DTheme = {
  bgGradient: 'from-slate-950 via-indigo-950 to-purple-950',
  badgeBorder: 'border-indigo-400/60 shadow-[0_0_15px_rgba(129,140,248,0.25)]',
  badgeShape: 'rounded-2xl',
  textStart: '#E0E7FF',
  textMid: '#6366F1',
  textEnd: '#4338CA',
  sideShadow: '#312E81',
  glowColor: '#6366F1',
  ringColor: '#EEF2FF',
  description: '3D Universal Monogram Emblem'
};

export const generateAvatarStyles = (letter: string): Letter3DTheme[] => {
  const isLetter = /[A-Z]/.test(letter.toUpperCase());
  const letterKey = isLetter ? letter.toUpperCase() : 'A';
  const baseTheme = LETTER_3D_THEMES[letterKey] || DEFAULT_3D_THEME;

  return [
    baseTheme, // Style 0: Default Letter Theme
    { // Style 1: Cyberpunk Neon
      bgGradient: 'from-slate-950 via-fuchsia-950 to-cyan-950',
      badgeBorder: 'border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
      badgeShape: 'rounded-2xl',
      textStart: '#A5F3FC',
      textMid: '#06B6D4',
      textEnd: '#0891B2',
      sideShadow: '#164E63',
      glowColor: '#E879F9',
      ringColor: '#FDF4FF',
      description: 'Cyberpunk Neon'
    },
    { // Style 2: Luxury Gold
      bgGradient: 'from-slate-950 via-yellow-950 to-amber-950',
      badgeBorder: 'border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.3)]',
      badgeShape: 'rounded-full',
      textStart: '#FEF08A',
      textMid: '#EAB308',
      textEnd: '#A16207',
      sideShadow: '#713F12',
      glowColor: '#FACC15',
      ringColor: '#FEF9C3',
      description: 'Luxury Gold'
    },
    { // Style 3: Dark Silver/Minimal
      bgGradient: 'from-slate-950 via-slate-900 to-slate-950',
      badgeBorder: 'border-slate-500/60 shadow-[0_0_15px_rgba(100,116,139,0.3)]',
      badgeShape: 'rounded-xl',
      textStart: '#F1F5F9',
      textMid: '#94A3B8',
      textEnd: '#475569',
      sideShadow: '#1E293B',
      glowColor: '#94A3B8',
      ringColor: '#F8FAFC',
      description: 'Dark Silver Minimal'
    },
    { // Style 4: Cosmic Violet
      bgGradient: 'from-slate-950 via-violet-950 to-purple-950',
      badgeBorder: 'border-violet-400/60 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
      badgeShape: 'rounded-2xl',
      textStart: '#DDD6FE',
      textMid: '#8B5CF6',
      textEnd: '#5B21B6',
      sideShadow: '#4C1D95',
      glowColor: '#A78BFA',
      ringColor: '#F5F3FF',
      description: 'Cosmic Violet'
    },
    { // Style 5: Emerald Forest
      bgGradient: 'from-slate-950 via-emerald-950 to-green-950',
      badgeBorder: 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
      badgeShape: 'rounded-full',
      textStart: '#A7F3D0',
      textMid: '#10B981',
      textEnd: '#047857',
      sideShadow: '#064E3B',
      glowColor: '#34D399',
      ringColor: '#ECFDF5',
      description: 'Emerald Forest'
    }
  ];
};
