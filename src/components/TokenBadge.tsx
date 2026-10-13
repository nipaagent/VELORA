import React from 'react';
import { Zap, Crown, Sparkles } from 'lucide-react';
import { TokenState, UserProfile } from '../types';
import { cn, formatTokenCount, calculateTokenBalance } from '../lib/utils';
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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all border border-zinc-800 bg-zinc-900 text-white shadow-2xs group cursor-pointer shrink-0 select-none hover:bg-zinc-800"
        title="ভিআইপি আনলিমিটেড অ্যাক্সেস সক্রিয় (Unlimited Access Active) - বিস্তারিত দেখতে ক্লিক করুন"
      >
        <Crown className="w-3.5 h-3.5 shrink-0 text-white fill-white" />

        <div className="flex items-center gap-1 font-black">
          <span className="text-sm font-black text-white leading-none">∞</span>
          
          {!compact && (
            <span className="text-[10px] font-black text-zinc-900 bg-white px-1.5 py-0.2 rounded-full hidden sm:inline">
              VIP
            </span>
          )}
        </div>
      </motion.button>
    );
  }

  const { remaining, totalLimit, percentage } = calculateTokenBalance(tokenState);
  const isLow = percentage <= 15;

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border outline-none shadow-2xs group cursor-pointer shrink-0 select-none",
        isLow 
          ? "bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800" 
          : "bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200"
      )}
      title={`টোকেন বাকি: ${formatTokenCount(remaining)} / ${formatTokenCount(totalLimit)} (${percentage}%) - বিস্তারিত দেখতে ক্লিক করুন`}
    >
      <Zap className={cn(
        "w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110",
        isLow ? "text-white fill-white" : "text-zinc-900 fill-zinc-900"
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
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
      )}
    </motion.button>
  );
}
