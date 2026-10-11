import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Shield, Zap, Sparkles } from 'lucide-react';
import { formatTokenCount } from '../../lib/utils';
import { TokenState } from '../../types';

interface SharedSessionHeaderProps {
  ownerName: string;
  expiresAt: number; // timestamp, 0 = never
  tokenState: TokenState;
  onExitSession: () => void;
}

export default function SharedSessionHeader({
  ownerName,
  expiresAt,
  tokenState,
  onExitSession,
}: SharedSessionHeaderProps) {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (expiresAt === 0) {
      setTimeLeftStr('আজীবন সক্রিয় (Unlimited)');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeftStr('সময় শেষ (Expired)');
        onExitSession();
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (days > 0) {
        setTimeLeftStr(`${days} দিন ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalTokensAvailable = (tokenState.maxDailyTokens || 50000) + (tokenState.bonusTokens || 0);
  const remainingTokens = Math.max(0, totalTokensAvailable - (tokenState.tokensUsedToday || 0));

  return (
    <div className="w-full bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 shadow-sm shrink-0 z-20">
      {/* Left: Shared Account Name */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">শেয়ার্ড অ্যাকাউন্ট</span>
          </div>
          <p className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">
            {ownerName}
          </p>
        </div>
      </div>

      {/* Center: Live Countdown Timer */}
      <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl">
        <Clock className={cn("w-3.5 h-3.5", isExpired ? "text-rose-400" : "text-amber-400 animate-pulse")} />
        <div className="text-[11px] font-mono font-bold tracking-tight">
          <span className="text-slate-400 hidden sm:inline mr-1">অবশিষ্ট সময়:</span>
          <span className={cn(isExpired ? "text-rose-400" : "text-amber-300 font-extrabold")}>
            {timeLeftStr}
          </span>
        </div>
      </div>

      {/* Right: Main Account Token & Exit Button */}
      <div className="flex items-center gap-2">
        {/* Token Balance indicator */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/40">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>মেইন টোকেন: <strong className="text-white">{formatTokenCount(remainingTokens)}</strong></span>
        </div>

        {/* Exit Button */}
        <button
          type="button"
          onClick={onExitSession}
          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          title="শেয়ার্ড সেশন থেকে প্রস্থান করুন"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">প্রস্থান</span>
        </button>
      </div>
    </div>
  );
}
