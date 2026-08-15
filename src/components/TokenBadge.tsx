import React from 'react';
import { Zap, Crown, Sparkles } from 'lucide-react';
import { TokenState, UserProfile } from '../types';
import { cn, formatTokenCount } from '../lib/utils';
import { motion } from 'motion/react';

interface TokenBadgeProps {
  tokenState: TokenState;
  userProfile?: UserProfile | null;
  onClick: () => void;
  compact?: boolean;
}

export default function TokenBadge({ tokenState, userProfile, onClick, compact = false }: TokenBadgeProps) {
  const isVipActive = Boolean((userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()) || (userProfile?.isVip && (!userProfile?.vipExpiresAt || userProfile.vipExpiresAt === 0)));

  if (isVipActive) {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all border border-amber-300/80 bg-gradient-to-r from-amber-100 via-amber-50 to-purple-100 text-amber-900 shadow-2xs group cursor-pointer shrink-0 select-none"
        title="ভিআইপি আনলিমিটেড অ্যাক্সেস সক্রিয় (Unlimited Access Active) - বিস্তারিত দেখতে ক্লিক করুন"
      >
        <Crown className="w-3.5 h-3.5 shrink-0 text-amber-600 fill-amber-500 animate-pulse" />

        <div className="flex items-center gap-1 font-black">
          <span className="text-sm font-black text-amber-950 leading-none">∞</span>
          
          {!compact && (
            <span className="text-[10px] font-black text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded-full hidden sm:inline">
              VIP
            </span>
          )}
        </div>
      </motion.button>
    );
  }

  const totalLimit = (tokenState.maxDailyTokens || 37000) + (tokenState.bonusTokens || 0);
  const used = tokenState.tokensUsedToday || 0;
  const remaining = Math.max(0, totalLimit - used);
  const percentage = Math.min(100, Math.max(0, Math.round((remaining / totalLimit) * 100)));

  // Color theme based on remaining percentage
  const isLow = percentage <= 15;
  const isMedium = percentage > 15 && percentage <= 50;

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border outline-none shadow-2xs group cursor-pointer shrink-0 select-none",
        isLow 
          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
          : isMedium 
            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            : "bg-indigo-50/90 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100"
      )}
      title={`টোকেন বাকি: ${formatTokenCount(remaining)} / ${formatTokenCount(totalLimit)} (${percentage}%) - বিস্তারিত দেখতে ক্লিক করুন`}
    >
      <Zap className={cn(
        "w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110",
        isLow ? "text-rose-600 animate-bounce" : isMedium ? "text-amber-600" : "text-indigo-600 fill-indigo-600"
      )} />

      <div className="flex items-center gap-1">
        <span className="font-extrabold tracking-tight">
          {percentage}%
        </span>
        
        {!compact && (
          <span className="text-[10px] opacity-80 hidden sm:inline font-mono">
            ({formatTokenCount(remaining)})
          </span>
        )}
      </div>

      {isLow && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
      )}
    </motion.button>
  );
}
