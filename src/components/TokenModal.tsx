import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Tv, CheckCircle2, Sparkles, AlertCircle, PlayCircle, Loader2, Award, Gift, ExternalLink, RefreshCw, Ticket, Crown, Send, Clock, Save } from 'lucide-react';
import { TokenState, UserProfile, RedeemCode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatTokenCount } from '../lib/utils';
import { ref, get, update } from 'firebase/database';
import { db } from '../lib/firebase';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenState: TokenState;
  onRewardClaimed: (bonusAmount: number) => void;
  onVipClaimed?: (vipDays: number, expiresAt: number) => void;
  adLinks?: string[];
  adRewardTokenAmount?: number;
  defaultMaxDailyTokens?: number;
  userId?: string;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (updated: UserProfile) => void;
}

const DEFAULT_AD_LINK = "https://www.effectivecpmnetwork.com/pqga5b64q?key=b284a9c6c1b29d340ea4c11c2e497170";

const PRESET_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Sky', value: '#0284c7' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
];

export default function TokenModal({ 
  isOpen, 
  onClose, 
  tokenState, 
  onRewardClaimed, 
  onVipClaimed,
  adLinks,
  adRewardTokenAmount = 30000,
  defaultMaxDailyTokens = 50000,
  userId,
  userProfile,
  onUpdateProfile
}: TokenModalProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(30);
  const [canClaim, setCanClaim] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);
  const [adIframeLoaded, setAdIframeLoaded] = useState(false);
  const [adLoadFailed, setAdLoadFailed] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [phaseNumber, setPhaseNumber] = useState(1); // 1 = first 15s ad, 2 = second 15s ad

  const isVipActive = Boolean(userProfile?.isVip || (userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()));

  // Color Picker States
  const [selectedColor, setSelectedColor] = useState(userProfile?.themeColor || '#4f46e5');
  const [selectedGlow, setSelectedGlow] = useState(userProfile?.themeGlow || 0.5);
  const [isSavingColor, setIsSavingColor] = useState(false);

  // Redeem Code States
  const [redeemInput, setRedeemInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const activeAdLinks = (adLinks && adLinks.length > 0) ? adLinks : [DEFAULT_AD_LINK];
  const activeAdUrl = activeAdLinks[currentAdIndex % activeAdLinks.length] || DEFAULT_AD_LINK;

  const totalLimit = (tokenState.maxDailyTokens || defaultMaxDailyTokens) + (tokenState.bonusTokens || 0);
  const used = tokenState.tokensUsedToday || 0;
  const remaining = Math.max(0, totalLimit - used);
  const percentage = Math.min(100, Math.max(0, Math.round((remaining / totalLimit) * 100)));

  // Realtime Redeem Code Submit Handler
  const handleRedeemCode = async () => {
    const cleanCode = redeemInput.trim().toUpperCase();
    if (!cleanCode) {
      setRedeemError("দয়া করে রিডিম কোডটি টাইপ করুন!");
      return;
    }

    if (!userId) {
      setRedeemError("রিডিম করতে পূর্বে লগইন অথবা একাউন্ট সেভ করুন!");
      return;
    }

    setIsRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const codeRef = ref(db, `redeem_codes/${cleanCode}`);
      const snapshot = await get(codeRef);

      if (!snapshot.exists()) {
        setRedeemError("❌ ভুল রিডিম কোড! সঠিক কোডটি টাইপ করে চেষ্টা করুন।");
        setIsRedeeming(false);
        return;
      }

      const codeData = snapshot.val() as RedeemCode;

      if (codeData.isActive === false) {
        setRedeemError("⚠️ এই রিডিম কোডটি বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে।");
        setIsRedeeming(false);
        return;
      }

      if (codeData.expiresAt && codeData.expiresAt < Date.now()) {
        setRedeemError("⚠️ এই রিডিম কোডের সময়সীমা (Expiration Time) শেষ হয়ে গেছে!");
        setIsRedeeming(false);
        return;
      }

      if ((codeData.usedCount || 0) >= (codeData.maxUses || 1)) {
        setRedeemError("⚠️ এই রিডিম কোডের সর্বমোট ব্যবহারের সীমা শেষ হয়ে গেছে!");
        setIsRedeeming(false);
        return;
      }

      if (codeData.usedBy && codeData.usedBy[userId]) {
        setRedeemError("⚠️ আপনি ইতিপূর্বে এই রিডিম কোডটি ব্যবহার করেছেন!");
        setIsRedeeming(false);
        return;
      }

      // Record Redemption updates in Firebase Realtime Database
      const updates: { [path: string]: any } = {};
      updates[`redeem_codes/${cleanCode}/usedCount`] = (codeData.usedCount || 0) + 1;
      updates[`redeem_codes/${cleanCode}/usedBy/${userId}`] = Date.now();

      if (codeData.rewardType === 'tokens') {
        const addedTokens = codeData.tokenAmount || 50000;
        const currentBonus = tokenState.bonusTokens || 0;
        const newBonus = currentBonus + addedTokens;

        updates[`users/${userId}/tokenState/bonusTokens`] = newBonus;
        await update(ref(db), updates);

        onRewardClaimed(addedTokens);
        setRedeemSuccess(`🎉 অভিনন্দন! +${formatTokenCount(addedTokens)} বোনাস টোকেন আপনার একাউন্টে যুক্ত হয়েছে!`);
      } else if (codeData.rewardType === 'vip_days') {
        const days = codeData.vipDays || 1;
        const currentVipExp = userProfile?.vipExpiresAt || 0;
        const baseTime = currentVipExp > Date.now() ? currentVipExp : Date.now();
        const newVipExp = baseTime + (days * 24 * 60 * 60 * 1000);

        updates[`users/${userId}/vipExpiresAt`] = newVipExp;
        updates[`users/${userId}/isVip`] = true;

        await update(ref(db), updates);

        if (onVipClaimed) {
          onVipClaimed(days, newVipExp);
        }
        setRedeemSuccess(`🎉 অভিনন্দন! ${days} দিনের জন্য ভিআইপি আনলিমিটেড অ্যাক্সেস চালু হয়েছে!`);
      }

      setRedeemInput('');
    } catch (err: any) {
      console.error("Redeem error:", err);
      setRedeemError("রিডিম কোড প্রসেস করতে সমস্যা: " + err.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSaveThemeSettings = async (color: string, glow: number) => {
    if (!userId || !userProfile || !onUpdateProfile) return;
    
    setIsSavingColor(true);
    setSelectedColor(color);
    setSelectedGlow(glow);
    
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        themeColor: color,
        themeGlow: glow
      };
      
      await update(ref(db, `users/${userId}`), { 
        themeColor: color,
        themeGlow: glow
      });
      onUpdateProfile(updatedProfile);
      
      // Also update local storage if needed, though App.tsx usually handles profile state
    } catch (err) {
      console.error("Theme settings update error:", err);
    } finally {
      setIsSavingColor(false);
    }
  };

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
    onRewardClaimed(adRewardTokenAmount); // Grant bonus tokens
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
                <p className="text-[11px] font-semibold text-slate-500">প্রতিদিন {formatTokenCount(tokenState.maxDailyTokens || defaultMaxDailyTokens)} ফ্রি টোকেন ও অ্যাড দেখে +{formatTokenCount(adRewardTokenAmount)} ফ্রি টোকেন</p>
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
                  <div>আপনার একাউন্টে {formatTokenCount(adRewardTokenAmount)} বোনাস টোকেন সফলভাবে যুক্ত হয়েছে!</div>
                </div>
              </motion.div>
            )}

            {/* Token Progress Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                      {isVipActive ? (
                        <Crown className="w-40 h-40 text-amber-400 fill-amber-400" />
                      ) : (
                        <Zap className="w-40 h-40 text-indigo-400 fill-indigo-400" />
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-black tracking-widest text-indigo-300 uppercase flex items-center gap-1.5">
                        {isVipActive ? (
                          <>
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            ভিআইপি মেম্বারশিপ স্ট্যাটাস
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            আজকের অবশিষ্ট টোকেন
                          </>
                        )}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1",
                        isVipActive
                          ? "bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-400/40"
                          : percentage <= 15 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                      )}>
                        {isVipActive ? "∞ UNLIMITED VIP" : `${percentage}% বাকি`}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2.5">
                      <span className="text-3xl font-black tabular-nums tracking-tight text-amber-300 flex items-center gap-1">
                        {isVipActive ? "∞" : formatTokenCount(remaining)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {isVipActive ? "/ ∞ (আনলিমিটেড অ্যাক্সেস)" : `/ ${formatTokenCount(totalLimit)} টোকেন`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 mb-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isVipActive ? "100%" : `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full transition-all",
                          isVipActive
                            ? "bg-gradient-to-r from-amber-400 via-amber-300 to-purple-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                            : percentage <= 15 
                              ? "bg-gradient-to-r from-rose-500 to-amber-500" 
                              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80 text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">স্ট্যাটাস টাইপ:</span>
                        <span className="font-extrabold text-amber-300">
                          {isVipActive ? "👑 ভিআইপি আনলিমিটেড" : "ফ্রি অ্যাকাউন্ট"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          {isVipActive ? "মেয়াদ উত্তীর্ণের সময়:" : "অ্যাড/বোনাস টোকেন:"}
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          {isVipActive 
                            ? (userProfile?.vipExpiresAt ? `${new Date(userProfile.vipExpiresAt).toLocaleDateString()} পর্যন্ত` : 'আনলিমিটেড')
                            : `+${formatTokenCount(tokenState.bonusTokens || 0)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-600 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2">
                    <span className="text-amber-600 shrink-0 mt-0.5 font-bold">💡</span>
                    <span>
                      <strong>গুরুত্বপূর্ণ তথ্য:</strong> রিডিম কোড থেকে পাওয়া বোনাস টোকেন ২৪ ঘণ্টা পর মুছে যায় না (মেয়াদহীন)। আর ভিআইপি রিডিম করলে মেয়াদের সময়সূচী অনুযায়ী সম্পূর্ণ আনলিমিটেড টোকেন ব্যবহার করতে পারবেন।
                    </span>
                  </div>

            {/* Watch Ad Action Section */}
            {!isVipActive && (
              !isWatchingAd ? (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">টোকেন শেষ বা রিচার্জ প্রয়োজন?</h4>
                      <p className="text-xs text-slate-600 font-semibold">৩০ সেকেন্ড এড দেখে প্রতিবার {formatTokenCount(adRewardTokenAmount)} টোকেন ফ্রি নিন!</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartWatchAd}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-black text-sm shadow-md hover:from-indigo-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>৩০ সে. অ্যাড দেখুন (+{formatTokenCount(adRewardTokenAmount)} টোকেন)</span>
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
                      <span>ক্লেম করুন (+{formatTokenCount(adRewardTokenAmount)} টোকেন)</span>
                    </motion.button>
                  )}
                </div>
              )
            )}

            {/* VIP Theme Color Picker Section */}
            {isVipActive && (
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">ভিআইপি থিম কালার কাস্টমাইজেশন</h4>
                    <p className="text-[11px] text-slate-600 font-semibold">আপনার পছন্দের কালার সেট করুন যা পুরো অ্যাপে দেখা যাবে</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative group">
                      <input 
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-20 h-20 p-0 rounded-2xl border-4 border-white shadow-xl cursor-pointer overflow-hidden shrink-0 transition-transform hover:scale-105"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-1.5 rounded-lg shadow-lg pointer-events-none">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">HEX</span>
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#HEX Code"
                          className="w-full pl-12 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase">গ্লো ইনটেনসিটি (Glow)</span>
                          <span className="text-[10px] font-mono font-black text-indigo-600">{Math.round(selectedGlow * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={selectedGlow}
                          onChange={(e) => setSelectedGlow(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleSaveThemeSettings(selectedColor, selectedGlow)}
                        disabled={isSavingColor}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                      >
                        {isSavingColor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>সেটিংস আপডেট করুন</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>প্রোফাইল বর্ডার এবং চ্যাট বক্সে আপনার পছন্দের কালার দেখা যাবে</span>
                  </div>
                </div>
              </div>
            )}

            {/* Redeem Promo Code Section */}
            {!isVipActive && (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-purple-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <span>রিডিম কোড সাবমিট করুন</span>
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">REDEEM</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-semibold">এডমিনের দেয়া রিডিম কোড থেকে ফ্রি টোকেন বা ভিআইপি নিন</p>
                  </div>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {redeemSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl p-3 text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{redeemSuccess}</span>
                </motion.div>
              )}

              {redeemError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-800 rounded-xl p-3 text-xs font-bold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{redeemError}</span>
                </motion.div>
              )}

              {/* Redeem Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemInput}
                  onChange={(e) => {
                    setRedeemInput(e.target.value.toUpperCase());
                    if (redeemError) setRedeemError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedeemCode();
                  }}
                  placeholder="কোড লিখুন (যেমন: VELORA100K)"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-black tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase shadow-xs"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isRedeeming || !redeemInput.trim()}
                  onClick={handleRedeemCode}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isRedeeming ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>রিডিম করুন</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>

          {/* Footer Note */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] font-semibold text-slate-500">
              ⚡ প্রতিটি চ্যাট রিকোয়েস্টে প্রকৃত ব্যবহৃত টোকেন হিসাব করে কাটা হয়। প্রতিদিন রাত ১২টায় ফ্রি {formatTokenCount(tokenState.maxDailyTokens || defaultMaxDailyTokens)} টোকেন রিসেট হয়।
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
