import React, { useState } from 'react';
import { 
  Users, Zap, Crown, Search, ArrowUpDown, 
  Sparkles, ShieldCheck, CheckCircle2, TrendingUp, Layers
} from 'lucide-react';
import { AdminUser } from './adminTypes';
import { formatTokenCount, cn } from '../../lib/utils';
import UserAvatar from '../UserAvatar';

interface AdminTokensTabProps {
  users: AdminUser[];
}

export const AdminTokensTab: React.FC<AdminTokensTabProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVip, setFilterVip] = useState<'all' | 'vip' | 'free'>('all');
  const [sortField, setSortField] = useState<'used' | 'bonus' | 'username'>('used');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const now = Date.now();

  // Summary Metrics calculations
  const totalUsers = users.length;
  const vipUsersCount = users.filter(u => 
    Boolean((u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0)))
  ).length;

  const totalUsedToday = users.reduce((acc, u) => acc + (u.tokenState?.tokensUsedToday || 0), 0);
  const totalBonusTokens = users.reduce((acc, u) => acc + (u.tokenState?.bonusTokens || 0), 0);

  // Filtered & Sorted Users
  const filteredUsers = users.filter(u => {
    const isVip = Boolean((u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0)));
    const matchSearch = 
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchVip = 
      filterVip === 'all' || 
      (filterVip === 'vip' && isVip) || 
      (filterVip === 'free' && !isVip);

    return matchSearch && matchVip;
  });

  filteredUsers.sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortField === 'used') {
      valA = a.tokenState?.tokensUsedToday || 0;
      valB = b.tokenState?.tokensUsedToday || 0;
    } else if (sortField === 'bonus') {
      valA = a.tokenState?.bonusTokens || 0;
      valB = b.tokenState?.bonusTokens || 0;
    } else {
      const nameA = (a.username || '').toLowerCase();
      const nameB = (b.username || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'used' | 'bonus' | 'username') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* মোট ইউজার */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">মোট ইউজার</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {totalUsers.toLocaleString('bn-BD')} <span className="text-xs font-sans text-slate-400 font-normal">জন</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">নিবন্ধিত সক্রিয় প্রোফাইল</div>
        </div>

        {/* আজকে মোট খরচ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">আজকে মোট খরচ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatTokenCount(totalUsedToday)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">আজকের ব্যবহৃত মোট টোকেন</div>
        </div>

        {/* মোট বোনাস টোকেন */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">মোট বোনাস টোকেন</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatTokenCount(totalBonusTokens)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">ইউজারদের অব্যবহৃত বোনাস পুল</div>
        </div>

        {/* VIP ইউজার সংখ্যা */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">VIP ইউজার সংখ্যা</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {vipUsersCount.toLocaleString('bn-BD')} <span className="text-xs font-sans text-slate-400 font-normal">জন</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">আনলিমিটেড মেম্বারশিপ সক্রিয়</div>
        </div>
      </div>

      {/* 2. Per-User Token Usage Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>ইউজার টোকেন ব্যবহার ড্যাশবোর্ড</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিটি ইউজারের দৈনিক টোকেন খরচ, অবশিষ্ট ব্যালেন্স ও বোনাস পর্যবেক্ষণের লাইভ টেবিল।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ইউজারনেম বা নাম দিয়ে খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterVip}
              onChange={(e) => setFilterVip(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">সকল ইউজার</option>
              <option value="vip">শুধুমাত্র VIP</option>
              <option value="free">ফ্রি ইউজার</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th 
                  onClick={() => toggleSort('username')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>ইউজারনেম / প্রোফাইল</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">ভিআইপি স্ট্যাটাস</th>
                <th 
                  onClick={() => toggleSort('used')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>আজকে খরচ (Used Today)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">আজকের অবশিষ্ট (Remaining)</th>
                <th 
                  onClick={() => toggleSort('bonus')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>বোনাস ব্যালেন্স (Bonus)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">দৈনিক ফ্রি লিমিট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isVip = Boolean((u.vipExpiresAt && u.vipExpiresAt > now) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0)));
                const dailyLimit = u.tokenState?.maxDailyTokens ?? 50000;
                const bonus = u.tokenState?.bonusTokens ?? 0;
                const totalLimit = dailyLimit + bonus;
                const used = u.tokenState?.tokensUsedToday ?? 0;
                const remaining = isVip ? 'আনলিমিটেড' : Math.max(0, totalLimit - used);

                return (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    {/* User profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar 
                          name={u.fullName || u.username} 
                          avatarIndex={u.avatarIndex} 
                          size={32} 
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{u.username}</span>
                            {u.role === 'admin' && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded font-mono font-bold">ADMIN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {u.fullName || u.email || 'NIPA User'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* VIP Badge */}
                    <td className="px-4 py-3">
                      {isVip ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>VIP এক্সেস</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          ফ্রি ইউজার
                        </span>
                      )}
                    </td>

                    {/* Used Today */}
                    <td className="px-4 py-3 font-mono font-bold">
                      <div className={cn(
                        "text-xs",
                        used > 0 ? "text-rose-600 font-black" : "text-slate-400"
                      )}>
                        {formatTokenCount(used)}
                      </div>
                    </td>

                    {/* Remaining */}
                    <td className="px-4 py-3 font-mono">
                      {isVip ? (
                        <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>আনলিমিটেড</span>
                        </span>
                      ) : (
                        <span className={cn(
                          "text-xs font-bold",
                          typeof remaining === 'number' && remaining <= 5000 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {typeof remaining === 'number' ? formatTokenCount(remaining) : remaining}
                        </span>
                      )}
                    </td>

                    {/* Bonus Balance */}
                    <td className="px-4 py-3 font-mono font-bold">
                      <div className="text-purple-600">
                        +{formatTokenCount(bonus)}
                      </div>
                    </td>

                    {/* Daily Limit */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                      {formatTokenCount(dailyLimit)}
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    কোনো ইউজার ডাটা পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
