import React, { useState } from 'react';
import { 
  Users, Search, UserPlus, Crown, Zap, 
  Ban, ShieldCheck, Eye, EyeOff, Copy, 
  CheckCircle2, Trash2, Edit3, Sparkles, Filter, MoreVertical, RotateCcw
} from 'lucide-react';
import { cn, formatTokenCount } from '../../lib/utils';
import UserAvatar from '../UserAvatar';
import { AdminUser } from './adminTypes';

interface AdminUsersTabProps {
  users: AdminUser[];
  onOpenAddUser: () => void;
  onOpenEditUser: (user: AdminUser) => void;
  onOpenTokenModal: (user: AdminUser) => void;
  onOpenVipModal: (user: AdminUser) => void;
  onToggleBanUser: (user: AdminUser) => Promise<void>;
  onToggleRole: (user: AdminUser) => Promise<void>;
  onDeleteUser: (uid: string, username: string) => Promise<void>;
  onBatchGiftTokens: (amount: number) => Promise<void>;
  onBatchResetUsedTokens: () => Promise<void>;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  onOpenAddUser,
  onOpenEditUser,
  onOpenTokenModal,
  onOpenVipModal,
  onToggleBanUser,
  onToggleRole,
  onDeleteUser,
  onBatchGiftTokens,
  onBatchResetUsedTokens
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'VIP' | 'BANNED' | 'ADMIN' | 'NEW'>('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordVisibility = (uid: string) => {
    setRevealedPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter calculations
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const filteredUsers = users.filter((u) => {
    const isVip = Boolean((u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0)));
    const isBanned = Boolean(u.isBanned || u.status === 'banned');
    const isAdmin = u.role === 'admin' || u.username?.toLowerCase() === 'admin';
    const isNew = Boolean(u.createdAt && u.createdAt > oneDayAgo);

    if (filterMode === 'ACTIVE' && isBanned) return false;
    if (filterMode === 'VIP' && !isVip) return false;
    if (filterMode === 'BANNED' && !isBanned) return false;
    if (filterMode === 'ADMIN' && !isAdmin) return false;
    if (filterMode === 'NEW' && !isNew) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.uid && u.uid.toLowerCase().includes(term)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(term))
    );
  });

  const vipTotal = users.filter(u => (u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0))).length;
  const bannedTotal = users.filter(u => u.isBanned || u.status === 'banned').length;
  const adminTotal = users.filter(u => u.role === 'admin' || u.username?.toLowerCase() === 'admin').length;
  const newTotal = users.filter(u => u.createdAt && u.createdAt > oneDayAgo).length;

  return (
    <div className="space-y-5">
      {/* Search, Filter & Action Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, ইউজারনেম, UID বা রেফারেল কোড খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onBatchGiftTokens(25000)}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="সকল ইউজারকে +২৫,০০০ বোনাস টোকেন দিন"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>সকলকে +২৫k গিফট</span>
            </button>

            <button
              onClick={onBatchResetUsedTokens}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="সকল ইউজারের আজকের ব্যবহৃত টোকেন রিসেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>ডেইলি ব্যবহৃত রিসেট</span>
            </button>

            <button
              onClick={onOpenAddUser}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন ইউজার</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'ALL', label: 'সব ইউজার', count: users.length },
            { id: 'ACTIVE', label: 'সক্রিয়', count: users.length - bannedTotal },
            { id: 'VIP', label: 'ভিআইপি / প্রো 👑', count: vipTotal },
            { id: 'BANNED', label: 'ব্যানড 🚫', count: bannedTotal },
            { id: 'ADMIN', label: 'অ্যাডমিন 🛡️', count: adminTotal },
            { id: 'NEW', label: 'নতুন ইউজার ⚡', count: newTotal },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer",
                filterMode === f.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              )}
            >
              <span>{f.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-mono",
                filterMode === f.id ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 text-slate-400 space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <div className="text-sm font-bold text-slate-600">কোনো ইউজার খুঁজে পাওয়া যায়নি</div>
          <div className="text-xs text-slate-400">ফিল্টার বা সার্চ কিওয়ার্ড পরিবর্তন করে চেষ্টা করুন।</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredUsers.map((u) => {
            const isVip = Boolean((u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0)));
            const isBanned = Boolean(u.isBanned || u.status === 'banned');
            const isAdmin = u.role === 'admin' || u.username?.toLowerCase() === 'admin';
            const isPasswordRevealed = Boolean(revealedPasswords[u.uid]);

            const maxDaily = u.tokenState?.maxDailyTokens ?? 50000;
            const usedToday = u.tokenState?.tokensUsedToday ?? 0;
            const bonusTokens = u.tokenState?.bonusTokens ?? 0;
            const remainingDaily = Math.max(0, maxDaily - usedToday);
            const totalAvailable = remainingDaily + bonusTokens;
            const usagePercent = Math.min(100, Math.round((usedToday / maxDaily) * 100));

            return (
              <div
                key={u.uid}
                className={cn(
                  "p-4 sm:p-5 rounded-3xl border transition-all space-y-4 relative overflow-hidden",
                  isBanned
                    ? "bg-rose-50/40 border-rose-200"
                    : isVip
                    ? "bg-gradient-to-br from-white via-amber-50/20 to-purple-50/20 border-amber-200/80 shadow-2xs"
                    : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300"
                )}
              >
                {/* Top Row: User Avatar, Name, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <UserAvatar 
                        name={u.fullName || u.username} 
                        avatarIndex={u.avatarIndex} 
                        avatarUrl={u.avatarUrl} 
                        size="md" 
                      />
                      {isVip && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {u.fullName || u.username}
                        </h4>

                        {isAdmin && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🛡️ ADMIN
                          </span>
                        )}

                        {isVip && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            👑 VIP
                          </span>
                        )}

                        {isBanned && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            🚫 BANNED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="font-mono text-indigo-600 font-bold">@{u.username}</span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick role/ban toggles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggleRole(u)}
                      className={cn(
                        "p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                        isAdmin 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" 
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
                      )}
                      title={isAdmin ? "অ্যাডমিন পদ বাতিল করুন" : "অ্যাডমিন বানান"}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleBanUser(u)}
                      className={cn(
                        "p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                        isBanned
                          ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                      )}
                      title={isBanned ? "আনব্যান করুন" : "ব্যান করুন"}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Second row: Credentials & Security Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Password box */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">পাসওয়ার্ড:</span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate">
                        {isPasswordRevealed ? (u.password || 'N/A') : '••••••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => togglePasswordVisibility(u.uid)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                        title={isPasswordRevealed ? "লুকান" : "দেখুন"}
                      >
                        {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {u.password && (
                        <button
                          onClick={() => handleCopy(u.password!, `pass-${u.uid}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                          title="পাসওয়ার্ড কপি করুন"
                        >
                          {copiedId === `pass-${u.uid}` ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Referral Code & UID box */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">রেফার কোড:</span>
                      <span className="font-mono font-bold text-indigo-700 text-xs truncate">
                        {u.referralCode || 'N/A'}
                      </span>
                    </div>

                    {u.referralCode && (
                      <button
                        onClick={() => handleCopy(u.referralCode!, `ref-${u.uid}`)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                        title="রেফার কোড কপি করুন"
                      >
                        {copiedId === `ref-${u.uid}` ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Token Meter */}
                <div className="space-y-1.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-600" />
                      অবশিষ্ট টোকেন: <strong className="text-slate-900 font-mono">{formatTokenCount(totalAvailable)}</strong>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      ব্যবহৃত: {formatTokenCount(usedToday)} / {formatTokenCount(maxDaily)} ({usagePercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        usagePercent > 90 ? "bg-rose-500" : usagePercent > 60 ? "bg-amber-500" : "bg-purple-600"
                      )}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>

                  {bonusTokens > 0 && (
                    <div className="text-[10px] text-purple-700 font-bold flex items-center gap-1 pt-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>+{formatTokenCount(bonusTokens)} বোনাস টোকেন যুক্ত আছে</span>
                    </div>
                  )}
                </div>

                {/* Action Controls Bar */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenVipModal(u)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>VIP ম্যানেজ</span>
                    </button>

                    <button
                      onClick={() => onOpenTokenModal(u)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>টোকেন</span>
                    </button>

                    <button
                      onClick={() => onOpenEditUser(u)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteUser(u.uid, u.username)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="ইউজার ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
