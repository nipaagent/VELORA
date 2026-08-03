import React from 'react';
import { LETTER_3D_THEMES, DEFAULT_3D_THEME, Letter3DTheme } from '../lib/letter3DThemes';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showBorder?: boolean;
}

export default function UserAvatar({ name, avatarUrl, size = 'md', className = '', showBorder = true }: UserAvatarProps) {
  // Extract clean first letter
  const cleanName = (name || 'User').trim();
  const firstChar = cleanName.charAt(0).toUpperCase();
  const isLetter = /[A-Z]/.test(firstChar);
  const letterKey = isLetter ? firstChar : 'A';
  const theme: Letter3DTheme = LETTER_3D_THEMES[letterKey] || DEFAULT_3D_THEME;

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

  const gradId = `letter-3d-grad-${letterKey}`;
  const filterId = `letter-3d-glow-${letterKey}`;

  return (
    <div
      style={customStyle}
      className={`relative inline-flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.bgGradient} ${theme.badgeShape} overflow-hidden transition-all duration-300 select-none ${showBorder ? `border ${theme.badgeBorder}` : ''} ${sizeClasses} ${className}`}
      title={`${cleanName} (${theme.description})`}
    >
      {/* 3D SVG Monogram Emblem */}
      <svg 
        className="w-full h-full p-0.5 transform group-hover:scale-105 transition-transform duration-300" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top Face Metallic Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.textStart} />
            {theme.textMid && <stop offset="50%" stopColor={theme.textMid} />}
            <stop offset="100%" stopColor={theme.textEnd} />
          </linearGradient>

          {/* Glowing Aura Filter */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Metallic Ring Accent */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          stroke={theme.ringColor} 
          strokeWidth="1.2" 
          strokeOpacity="0.35" 
          strokeDasharray="120 10" 
        />
        
        {/* Inner Glowing Bevel Ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          stroke={`url(#${gradId})`} 
          strokeWidth="1" 
          strokeOpacity="0.25" 
        />

        {/* 3D Extruded Depth Layers (Dark Side Shadows) */}
        <text
          x="53.5"
          y="68.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.sideShadow}
          opacity="0.95"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="52"
          letterSpacing="-1"
        >
          {letterKey}
        </text>

        <text
          x="52.5"
          y="67.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.sideShadow}
          opacity="0.8"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="52"
          letterSpacing="-1"
        >
          {letterKey}
        </text>

        <text
          x="51.5"
          y="66.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.sideShadow}
          opacity="0.6"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="52"
          letterSpacing="-1"
        >
          {letterKey}
        </text>

        {/* Top Face 3D Text with Metallic Gradient & Gloss Shine */}
        <text
          x="50"
          y="65"
          textAnchor="middle"
          dominantBaseline="central"
          fill={`url(#${gradId})`}
          filter={`url(#${filterId})`}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="52"
          letterSpacing="-1"
        >
          {letterKey}
        </text>

        {/* Top Glass Highlight Reflection Arc */}
        <path
          d="M 18 28 A 38 38 0 0 1 82 28 C 65 38 35 38 18 28 Z"
          fill="white"
          fillOpacity="0.12"
        />
      </svg>

      {/* Top Left Specular Dot */}
      <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-white/40 rounded-full blur-[0.5px] pointer-events-none" />
    </div>
  );
}
