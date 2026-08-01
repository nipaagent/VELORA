import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Tv, CheckCircle2, Sparkles, AlertCircle, PlayCircle, Loader2, Award, Gift, ExternalLink, RefreshCw } from 'lucide-react';
import { TokenState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenState: TokenState;
  onRewardClaimed: (bonusAmount: number) => void;
  adLinks?: string[];
}

const DEFAULT_AD_LINK = "https://www.effectivecpmnetwork.com/pqga5b64q?key=b284a9c6c1b29d340ea4c11c2e497170";

export default function TokenModal({ isOpen, onClose, tokenState, onRewardClaimed, adLinks }: TokenModalProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(30);
  const [canClaim, setCanClaim] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);
  const [adIframeLoaded, setAdIframeLoaded] = useState(false);
  const [adLoadFailed, setAdLoadFailed] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [phaseNumber, setPhaseNumber] = useState(1); // 1 = first 15s ad, 2 = second 15s ad

  const activeAdLinks = (adLinks && adLinks.length > 0) ? adLinks : [DEFAULT_AD_LINK];
  const activeAdUrl = activeAdLinks[currentAdIndex % activeAdLinks.length] || DEFAULT_AD_LINK;

  const totalLimit = (tokenState.maxDailyTokens || 100000) + (tokenState.bonusTokens || 0);
  const used = tokenState.tokensUsedToday || 0;
  const remaining = Math.max(0, totalLimit - used);
  const percentage = Math.min(100, Math.max(0, Math.round((remaining / totalLimit) * 100)));

  // Handle 30-second timer & 15-second mid-way refresh
  useEffect(() => {
    let interval: any = null;
    if (isWatchingAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => {
          const next = prev - 1;
          
          // Mid-way 15-second refresh trigger for second ad
          if (next === 15) {
            setPhaseNumber(2);
            setIframeKey((k) => k + 1);
            setCurrentAdIndex((idx) => (idx + 1) % activeAdLinks.length);
            setAdIframeLoaded(false); // require second ad load verification
          }

          if (next === 0) {
            setCanClaim(true);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWatchingAd, adTimer, activeAdLinks.length]);

  const handleStartWatchAd = () => {
    setIsWatchingAd(true);
    setAdTimer(30);
    setPhaseNumber(1);
    setCanClaim(false);
    setClaimedSuccess(false);
    setAdIframeLoaded(false);
    setAdLoadFailed(false);
    setIframeKey(Date.now());

    // Also pop open ad window so user actually gets ad impression if iframe is blocked by header policies
    try {
      window.open(activeAdUrl, '_blank');
    } catch (e) {
      console.warn("Popup blocked:", e);
    }
  };

  const handleIframeLoad = () => {
    setAdIframeLoaded(true);
    setAdLoadFailed(false);
  };

  const handleIframeError = () => {
    setAdLoadFailed(true);
    setAdIframeLoaded(false);
  };

  const handleClaimReward = () => {
    if (adLoadFailed) {
      alert("অ্যাডের সমস্যা হয়েছে বা এড পুরোপুরি লোড হতে পারেনি! দয়া করে পুনরায় অ্যাড চালু করুন।");
      return;
    }
    onRewardClaimed(50000); // Grant +50,000 bonus tokens
    setClaimedSuccess(true);
    setIsWatchingAd(false);
    
    setTimeout(() => {
      setClaimedSuccess(false);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base leading-snug">টোকেন ও প্রিমিয়াম ব্যালেন্স</h3>
                <p className="text-[11px] font-semibold text-slate-500">প্রতিদিন ১,০০,০০০ ফ্রি টোকেন ও অ্যাড দেখে +৫০,০০০ ফ্রি টোকেন</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Success Toast banner */}
            {claimedSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 flex items-center gap-3 text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black text-sm">অভিনন্দন! 🎉</div>
                  <div>আপনার একাউন্টে ৫০,০০০ বোনাস টোকেন সফলভাবে যুক্ত হয়েছে!</div>
                </div>
              </motion.div>
            )}

            {/* Token Progress Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <Zap className="w-40 h-40 text-indigo-400 fill-indigo-400" />
              </div>

              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-black tracking-widest text-indigo-300 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  আজকের অবশিষ্ট টোকেন
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider",
                  percentage <= 15 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                )}>
                  {percentage}% বাকি
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2.5">
                <span className="text-3xl font-black tabular-nums tracking-tight">
                  {remaining.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  / {totalLimit.toLocaleString()} টোকেন
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 mb-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    percentage <= 15 
                      ? "bg-gradient-to-r from-rose-500 to-amber-500" 
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80 text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">ফ্রি ডেইলি লিমিট:</span>
                  <span className="font-extrabold">{tokenState.maxDailyTokens?.toLocaleString() || '100,000'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">অ্যাড বোনাস অর্জিত:</span>
                  <span className="font-extrabold text-emerald-400">+{tokenState.bonusTokens?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>

            {/* Watch Ad Action Section */}
            {!isWatchingAd ? (
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">টোকেন শেষ বা রিচার্জ প্রয়োজন?</h4>
                    <p className="text-xs text-slate-600 font-semibold">৩০ সেকেন্ড এড দেখে প্রতিবার ৫০,০০০ টোকেন ফ্রি নিন!</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartWatchAd}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-black text-sm shadow-md hover:from-indigo-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>৩০ সে. অ্যাড দেখুন (+৫০,০০০ টোকেন)</span>
                </motion.button>
              </div>
            ) : (
              /* Extended Ad Frame Screen */
              <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-3 border border-indigo-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    স্পন্সর অ্যাড ({phaseNumber}/২ অ্যাড)
                  </span>
                  
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
                    {adTimer} সেকেন্ড বাকি
                  </span>
                </div>

                {/* ENLARGED AD CONTAINER BOX */}
                <div className="w-full h-80 bg-slate-950 rounded-xl border border-indigo-500/30 relative overflow-hidden flex flex-col items-center justify-center">
                  {!adIframeLoaded && !adLoadFailed && (
                    <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center p-4 gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-300">অ্যাড লোড করা হচ্ছে...</span>
                      <span className="text-[10px] text-slate-500">স্পন্সর নেটওয়ার্ক থেকে ডাটা কানেক্ট হচ্ছে</span>
                    </div>
                  )}

                  {adLoadFailed && (
                    <div className="absolute inset-0 bg-rose-950/90 z-10 flex flex-col items-center justify-center p-4 text-center gap-2">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <span className="text-xs font-bold text-rose-200">অ্যাড লোড হতে সমস্যা হয়েছে!</span>
                      <p className="text-[10px] text-rose-300/80 max-w-xs">
                        নেটওয়ার্ক বা অ্যাডব্লকারের কারণে এড না আসলে টোকেন দেওয়া সম্ভব নয়।
                      </p>
                      <button 
                        onClick={() => {
                          window.open(activeAdUrl, '_blank');
                          setAdIframeLoaded(true);
                          setAdLoadFailed(false);
                        }}
                        className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>সরাসরি লিংকে অ্যাড দেখুন</span>
                      </button>
                    </div>
                  )}

                  {/* Ad Iframe */}
                  <iframe
                    key={iframeKey}
                    src={`${activeAdUrl}&_t=${iframeKey}`}
                    title="Sponsor Advertisement"
                    className="w-full h-full border-0 rounded-xl bg-white"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>

                {/* Status bar & External Open button */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <RefreshCw className={cn("w-3 h-3 text-indigo-400", adTimer === 15 && "animate-spin")} />
                    ১৫ সে. এ ২য় এড রিফ্রেশ
                  </span>

                  <button
                    onClick={() => window.open(activeAdUrl, '_blank')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    নতুন ট্যাবে অ্যাড খুলুন
                  </button>
                </div>

                {/* Countdown / Claim Button */}
                {!canClaim ? (
                  <div className="w-full py-3 bg-slate-800/90 border border-slate-700/80 rounded-xl flex items-center justify-center gap-2 text-amber-400 font-black text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>অ্যাড দেখা শেষ হতে অপেক্ষা করুন ({adTimer}s)...</span>
                  </div>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaimReward}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award className="w-5 h-5 fill-slate-950" />
                    <span>ক্লেম করুন (+৫০,০০০ টোকেন)</span>
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] font-semibold text-slate-500">
              ⚡ প্রতিটি চ্যাট মেসেজে টোকেন ব্যবহৃত হয়। প্রতিদিন রাত ১২টায় ফ্রি ১,০০,০০০ টোকেন রিসেট হয়।
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
