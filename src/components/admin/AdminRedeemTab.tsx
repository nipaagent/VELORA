import React, { useState } from 'react';
import { 
  Ticket, Plus, Zap, Gift, Crown, 
  Copy, CheckCircle2, Link2, Clock, Trash2, Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatTokenCount } from '../../lib/utils';
import { RedeemCode, RedeemRewardType } from '../../types';

interface AdminRedeemTabProps {
  redeemCodes: RedeemCode[];
  onCreateRedeemCode: (codeData: Omit<RedeemCode, 'id' | 'usedCount' | 'usedBy'>) => Promise<void>;
  onToggleRedeemActive: (code: RedeemCode) => Promise<void>;
  onDeleteRedeemCode: (codeId: string) => Promise<void>;
  isSaving: boolean;
}

export const AdminRedeemTab: React.FC<AdminRedeemTabProps> = ({
  redeemCodes,
  onCreateRedeemCode,
  onToggleRedeemActive,
  onDeleteRedeemCode,
  isSaving
}) => {
  const [codeText, setCodeText] = useState('');
  const [rewardType, setRewardType] = useState<RedeemRewardType>('tokens');
  const [tokenAmount, setTokenAmount] = useState('50000');
  const [vipDays, setVipDays] = useState('7');
  const [maxUses, setMaxUses] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'NIPA-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodeText(res);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeText.trim()) {
      alert('অনুগ্রহ করে কোডের নাম প্রদান করুন!');
      return;
    }

    const payload: Omit<RedeemCode, 'id' | 'usedCount' | 'usedBy'> = {
      code: codeText.trim().toUpperCase(),
      rewardType,
      tokenAmount: rewardType === 'tokens' ? Number(tokenAmount) || 0 : undefined,
      vipDays: rewardType === 'vip_days' ? Number(vipDays) || 0 : undefined,
      maxUses: Number(maxUses) || 1,
      createdAt: Date.now(),
      isActive: true
    };

    await onCreateRedeemCode(payload);
    setCodeText('');
  };

  const filteredCodes = redeemCodes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Create Redeem Code Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                নতুন রিডিম ও প্রোমো ভাউচার তৈরি করুন
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                টোকেন বা ভিআইপি অ্যাক্সেসের জন্য ইউনিক প্রমো কোড জেনারেট করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateRandom}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>অটো জেনারেট</span>
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Code text */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300">মূল কোড টেক্সট (Promo Code)</label>
              <input
                type="text"
                value={codeText}
                onChange={(e) => setCodeText(e.target.value.toUpperCase())}
                placeholder="যেমন: NIPA-SPECIAL, PRO-GIFT"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-black text-amber-300 placeholder:text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Max uses */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">সর্বোচ্চ ব্যবহার সীমা (Max Uses)</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="১০ জন"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Reward Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">পুরস্কারের ধরন (Reward Type)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRewardType('tokens')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                    rewardType === 'tokens'
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                  )}
                >
                  <Gift className="w-4 h-4" />
                  <span>টোকেন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRewardType('vip_days')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                    rewardType === 'vip_days'
                      ? "bg-purple-500 text-white border-purple-400 font-black shadow-md"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                  )}
                >
                  <Crown className="w-4 h-4" />
                  <span>ভিআইপি</span>
                </button>
              </div>
            </div>

            {/* Dynamic Value */}
            {rewardType === 'tokens' ? (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">টোকেনের পরিমাণ</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="৫০,০০০"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[20000, 50000, 100000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTokenAmount(amt.toString())}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-bold rounded border border-slate-700 cursor-pointer"
                    >
                      +{formatTokenCount(amt)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">ভিআইপি মেয়াদ (দিন)</label>
                <input
                  type="number"
                  value={vipDays}
                  onChange={(e) => setVipDays(e.target.value)}
                  placeholder="৭ দিন"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[3, 7, 15, 30, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setVipDays(d.toString())}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 font-bold rounded border border-slate-700 cursor-pointer"
                    >
                      {d} দিন
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || !codeText.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Ticket className="w-4 h-4 text-slate-950" />
              <span>{isSaving ? 'তৈরি হচ্ছে...' : '🎟️ রিডিম কোড জেনারেট করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Active Redeem Codes List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              তৈরিকৃত রিডিম কোডের তালিকা ({redeemCodes.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">যেকোনো কোড কপি করে টেলিগ্রাম বা সোশ্যাল মিডিয়ায় শেয়ার করুন।</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="কোড খুঁজুন..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            এখনো কোনো রিডিম কোড পাওয়া যায়নি। উপরে ফরম থেকে তৈরি করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCodes.map((c) => {
              const isLimitReached = (c.usedCount || 0) >= (c.maxUses || 1);
              const directLink = `${window.location.origin}/?promo=${c.code}`;

              return (
                <div
                  key={c.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all space-y-3 relative",
                    c.isActive && !isLimitReached
                      ? "bg-white border-amber-200 shadow-xs hover:border-amber-300"
                      : "bg-slate-50 border-slate-200 opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900 bg-amber-50 border border-amber-300/80 px-2.5 py-1 rounded-xl tracking-wider">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopy(c.code, c.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="কোড কপি করুন"
                      >
                        {copiedCodeId === c.id ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(directLink, `${c.id}-link`)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="ডাইরেক্ট ক্লেইম লিংক কপি করুন"
                      >
                        {copiedCodeId === `${c.id}-link` ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {c.rewardType === 'tokens' ? (
                      <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Gift className="w-3 h-3" />
                        +{formatTokenCount(c.tokenAmount || 0)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-purple-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3 h-3 text-amber-300" />
                        {c.vipDays} দিন VIP
                      </span>
                    )}
                  </div>

                  {/* Progress & usage */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>ব্যবহারকারী:</span>
                      <span className="text-slate-800 font-mono font-bold">
                        {c.usedCount || 0} / {c.maxUses} জন
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((c.usedCount || 0) / (c.maxUses || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onToggleRedeemActive(c)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                          c.isActive
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        {c.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                      </button>

                      <button
                        onClick={() => onDeleteRedeemCode(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
