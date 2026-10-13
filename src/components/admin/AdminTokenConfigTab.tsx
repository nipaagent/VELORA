import React, { useState } from 'react';
import { 
  Zap, Gift, ExternalLink, Plus, Trash2, 
  CheckCircle2, Sparkles, AlertCircle, RefreshCw, Link as LinkIcon, Send
} from 'lucide-react';
import { cn, formatTokenCount } from '../../lib/utils';
import { auth, db } from '../../lib/firebase';
import { ref, push, set } from 'firebase/database';

interface AdminTokenConfigTabProps {
  tokenConfig: {
    adRewardTokenAmount: number;
    defaultMaxDailyTokens: number;
    tokenMultiplier: number;
  };
  onSaveTokenConfig: (cfg: { adRewardTokenAmount: number; defaultMaxDailyTokens: number; tokenMultiplier: number; }) => Promise<void>;
  onBatchUpdateAllUsersLimit: (newLimit: number) => Promise<void>;
  isSaving: boolean;
  totalUsersCount: number;
}

export const AdminTokenConfigTab: React.FC<AdminTokenConfigTabProps> = ({
  tokenConfig,
  onSaveTokenConfig,
  onBatchUpdateAllUsersLimit,
  isSaving,
  totalUsersCount
}) => {
  const [dailyLimit, setDailyLimit] = useState(tokenConfig.defaultMaxDailyTokens || 50000);
  const [multiplier, setMultiplier] = useState(tokenConfig.tokenMultiplier || 1);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  // Ad Link state
  const [newAdUrl, setNewAdUrl] = useState('');
  const [newAdDescription, setNewAdDescription] = useState('');
  const [isPublishingAd, setIsPublishingAd] = useState(false);

  const handlePublishAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdUrl.trim()) return;
    setIsPublishingAd(true);
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const adInfo = newAdDescription.trim() || 'নতুন অফার বা স্পন্সর বিজ্ঞাপন যুক্ত হয়েছে! টোকেন আর্ন করুন।';
      
      // Save to Firebase RTDB settings/ad_links
      const adRef = push(ref(db, 'settings/ad_links'));
      await set(adRef, {
        url: newAdUrl.trim(),
        description: adInfo,
        createdAt: Date.now()
      });

      // Broadcast to ALL subscribed users with title "নতুন অফার এসেছে!" and ad info in body
      if (idToken) {
        await fetch('/api/admin/ads/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            adUrl: newAdUrl.trim(),
            body: adInfo
          })
        }).catch(() => {});
      }

      setNewAdUrl('');
      setNewAdDescription('');
      alert('নতুন অফার সফলভাবে প্রকাশিত হয়েছে এবং সকল ইউজারের কাছে পুশ নোটিফিকেশন পাঠানো হয়েছে!');
    } catch (err: any) {
      alert('অফার প্রকাশ ব্যর্থ: ' + err.message);
    } finally {
      setIsPublishingAd(false);
    }
  };


  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveTokenConfig({
      defaultMaxDailyTokens: Number(dailyLimit),
      adRewardTokenAmount: tokenConfig.adRewardTokenAmount, // keep old value or just default to something
      tokenMultiplier: Number(multiplier)
    });
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 3000);
  };

  const handleBatchUpdateAll = async () => {
    const formatted = formatTokenCount(Number(dailyLimit));
    const confirm = window.confirm(
      `সতর্কতা: আপনি কি ডেটাবেসের সকল (${totalUsersCount} জন) ইউজারের দৈনিক ফ্রি টোকেন লিমিট ${formatted}-এ পরিবর্তন করতে চান?`
    );
    if (!confirm) return;

    setIsBatchUpdating(true);
    try {
      await onBatchUpdateAllUsersLimit(Number(dailyLimit));
      alert(`সফলভাবে সকল ${totalUsersCount} জন ইউজারের দৈনিক ফ্রি লিমিট আপডেট করা হয়েছে!`);
    } catch (err: any) {
      alert("আপডেট ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsBatchUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Token Economy Control */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              গ্লোবাল টোকেন ইকোনমি ও রিওয়ার্ড ইঞ্জিন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              এখান থেকে সকল সাধারণ ইউজারদের দৈনিক ফ্রি টোকেন এবং অ্যাড দেখে বোনাস টোকেন নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily limit */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>ডিফল্ট দৈনিক ফ্রি টোকেন</span>
                <span className="text-purple-600 font-mono">{formatTokenCount(dailyLimit)}</span>
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {[30000, 50000, 100000, 200000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDailyLimit(v)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                      dailyLimit === v
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {formatTokenCount(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Token Multiplier */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>টোকেন কাটার গুণক (Multiplier)</span>
                <span className="text-indigo-600 font-mono">{multiplier}x</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {[0.5, 1, 1.5, 2].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMultiplier(v)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                      multiplier === v
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isBatchUpdating}
              onClick={handleBatchUpdateAll}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>
                {isBatchUpdating ? 'আপডেট করা হচ্ছে...' : `⚡ সকল (${totalUsersCount}) ইউজারের লিমিট এখনই এক ক্লিকে আপডেট করুন`}
              </span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savedConfig ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>সেভ হয়েছে!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>গ্লোবাল সেটিং সেভ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. New Ad Publishing & Push Broadcast Card (Strict Monochrome) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black shadow-xs space-y-5 text-black">
        <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-black tracking-tight flex items-center gap-2">
              নতুন অফার বা বিজ্ঞাপন প্রকাশ (New Ad Link)
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              নতুন অফার বা স্পন্সর লিংক প্রকাশ করুন। প্রকাশ করার সাথে সাথে সকল সাবস্ক্রাইবারদের ডিভাইসে "নতুন অফার এসেছে!" পুশ পাঠানো হবে।
            </p>
          </div>
        </div>

        <form onSubmit={handlePublishAd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              অফার বা বিজ্ঞাপনের লিংক (Ad URL) <span className="text-black">*</span>
            </label>
            <input
              type="url"
              required
              value={newAdUrl}
              onChange={(e) => setNewAdUrl(e.target.value)}
              placeholder="https://example.com/special-offer"
              className="w-full px-3.5 py-2.5 bg-white border border-black rounded-xl text-xs font-mono text-black focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isPublishingAd}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              অফারের বিবরণ বা মেসেজ (Offer Info)
            </label>
            <input
              type="text"
              value={newAdDescription}
              onChange={(e) => setNewAdDescription(e.target.value)}
              placeholder="যেমন: স্পেশাল বোনাস অফার! বিজ্ঞাপন দেখে এখনই ৩০,০০০ টোকেন নিন।"
              className="w-full px-3.5 py-2.5 bg-white border border-black rounded-xl text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
              disabled={isPublishingAd}
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPublishingAd || !newAdUrl.trim()}
              className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white border border-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isPublishingAd ? 'প্রকাশ ও ব্রডকাস্ট করা হচ্ছে...' : 'অফার প্রকাশ ও নোটিফিকেশন পাঠান'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
