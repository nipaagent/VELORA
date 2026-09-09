import React, { useState } from 'react';
import { 
  Zap, Gift, ExternalLink, Plus, Trash2, 
  CheckCircle2, Sparkles, AlertCircle, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { cn, formatTokenCount } from '../../lib/utils';

interface AdminTokenConfigTabProps {
  tokenConfig: {
    adRewardTokenAmount: number;
    defaultMaxDailyTokens: number;
    tokenMultiplier: number;
  };
  onSaveTokenConfig: (cfg: { adRewardTokenAmount: number; defaultMaxDailyTokens: number; tokenMultiplier: number; }) => Promise<void>;
  onBatchUpdateAllUsersLimit: (newLimit: number) => Promise<void>;
  adLinks: string[];
  onAddAdLink: (link: string) => Promise<void>;
  onDeleteAdLink: (link: string) => Promise<void>;
  isSaving: boolean;
  totalUsersCount: number;
}

export const AdminTokenConfigTab: React.FC<AdminTokenConfigTabProps> = ({
  tokenConfig,
  onSaveTokenConfig,
  onBatchUpdateAllUsersLimit,
  adLinks,
  onAddAdLink,
  onDeleteAdLink,
  isSaving,
  totalUsersCount
}) => {
  const [dailyLimit, setDailyLimit] = useState(tokenConfig.defaultMaxDailyTokens || 50000);
  const [adReward, setAdReward] = useState(tokenConfig.adRewardTokenAmount || 30000);
  const [multiplier, setMultiplier] = useState(tokenConfig.tokenMultiplier || 1);
  const [newLink, setNewLink] = useState('');
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveTokenConfig({
      defaultMaxDailyTokens: Number(dailyLimit),
      adRewardTokenAmount: Number(adReward),
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

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;
    if (!newLink.startsWith('http://') && !newLink.startsWith('https://')) {
      alert('সঠিক URL প্রদান করুন (http:// বা https:// দিয়ে শুরু হতে হবে)');
      return;
    }
    await onAddAdLink(newLink.trim());
    setNewLink('');
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

            {/* Ad Reward Amount */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>বিজ্ঞাপন দেখে বোনাস টোকেন</span>
                <span className="text-amber-600 font-mono">{formatTokenCount(adReward)}</span>
              </label>
              <input
                type="number"
                value={adReward}
                onChange={(e) => setAdReward(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {[10000, 20000, 30000, 50000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAdReward(v)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                      adReward === v
                        ? "bg-amber-500 text-slate-950 border-amber-500"
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

      {/* 2. Ad Links Network Engine */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                মনিটাইজেশন ও স্পনসর অ্যাড লিংক ({adLinks.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ইউজাররা "Watch Ad" বাটনে ক্লিক করলে এই লিংকগুলো স্বয়ংক্রিয়ভাবে ওপেন হবে।
              </p>
            </div>
          </div>
        </div>

        {/* Add Link Form */}
        <form onSubmit={handleAddLinkSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://www.effectivecpmnetwork.com/... বা যেকোনো অ্যাড লিংক"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newLink.trim()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>নতুন লিংক যোগ করুন</span>
          </button>
        </form>

        {/* List of Active Ad Links */}
        <div className="space-y-2.5">
          {adLinks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              কোনো অ্যাড লিংক যুক্ত নেই। উপরে লিংক দিয়ে যোগ করুন।
            </div>
          ) : (
            adLinks.map((link, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate font-mono text-xs font-semibold text-slate-700">
                    {link}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                    title="লিংকটি টেস্ট করুন"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => onDeleteAdLink(link)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="লিংক মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
