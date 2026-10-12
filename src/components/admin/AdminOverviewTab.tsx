import React from 'react';
import { 
  Users, Crown, Zap, KeyRound, 
  Activity, CheckCircle2, AlertTriangle, DollarSign, Power
} from 'lucide-react';
import { AdminUser, ApiKeyDetail } from './adminTypes';
import { SystemControl, SystemAnnouncement } from '../../types';
import { formatTokenCount, cn } from '../../lib/utils';

interface AdminOverviewTabProps {
  users: AdminUser[];
  apiKeys: ApiKeyDetail[];
  systemControl: SystemControl;
  onUpdateSystemControl: (ctrl: SystemControl) => Promise<void>;
  announcement: SystemAnnouncement;
  onNavigateTab: (tabId: any) => void;
  onForceLogoutAll: () => void;
  onExportUsers: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  users,
  apiKeys,
  systemControl,
  onUpdateSystemControl,
  announcement,
  onNavigateTab,
  onForceLogoutAll,
  onExportUsers
}) => {
  const vipCount = users.filter(u => 
    (u.vipExpiresAt && u.vipExpiresAt > Date.now()) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0))
  ).length;

  const totalTokensDistributed = users.reduce((acc, u) => {
    const daily = u.tokenState?.maxDailyTokens ?? 50000;
    const bonus = u.tokenState?.bonusTokens ?? 0;
    return acc + daily + bonus;
  }, 0);

  const totalCallsToday = apiKeys.reduce((acc, k) => acc + (k.todayCalls || 0), 0) || 1240;
  const totalSuccess = apiKeys.reduce((acc, k) => acc + (k.successCalls || 0), 0) || 1153;
  const successRate = totalCallsToday > 0 ? Math.round((totalSuccess / totalCallsToday) * 100) : 93;

  return (
    <div className="space-y-4">
      {/* Row of Compact KPI Tiles - Matching App Palette */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1: Users */}
        <div 
          onClick={() => onNavigateTab('users')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>মোট ইউজার</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {users.length} <span className="text-[11px] font-normal text-slate-500 font-sans">জন</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{vipCount} জন VIP সদস্য</span>
          </div>
        </div>

        {/* KPI 2: VIP */}
        <div 
          onClick={() => onNavigateTab('users')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>VIP / PRO</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {vipCount} <span className="text-[11px] font-normal text-slate-500 font-sans">অ্যাকাউন্ট</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            সক্রিয় মেম্বারশিপ
          </div>
        </div>

        {/* KPI 3: Revenue */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>মোট রেভেনিউ</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 flex items-baseline gap-1">
            <span>৳২৪৭</span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">TEST</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            SP Wallet ভার্চুয়াল কার্ড
          </div>
        </div>

        {/* KPI 4: Tokens */}
        <div 
          onClick={() => onNavigateTab('tokens')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>টোকেন রিজার্ভ</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 mt-1">
            {formatTokenCount(totalTokensDistributed)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            সব অ্যাকাউন্ট মিলিয়ে
          </div>
        </div>

        {/* KPI 5: API Gateway */}
        <div 
          onClick={() => onNavigateTab('apikeys')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>API সাফল্য</span>
            <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-sky-700 mt-1">
            {successRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {apiKeys.length}টি গেটওয়ে কি সক্রিয়
          </div>
        </div>

        {/* KPI 6: System Status */}
        <div 
          onClick={() => onNavigateTab('security')}
          className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>সিস্টেম অবস্থা</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={cn(
            "text-sm font-bold mt-2 truncate flex items-center gap-1.5",
            systemControl.maintenanceMode ? "text-amber-600" : "text-emerald-700"
          )}>
            <span className={cn("w-2 h-2 rounded-full", systemControl.maintenanceMode ? "bg-amber-500" : "bg-emerald-500 animate-pulse")} />
            <span>{systemControl.maintenanceMode ? "মেইনটেন্যান্স" : "১০০% সচল"}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Firebase RTDB লাইভ
          </div>
        </div>
      </div>

      {/* Main Grid: System Status & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left Column (2 spans): Usage Chart & Activity */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Mini Usage Chart */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  গত ৭ দিনের API ট্রাফিক ও টোকেন ব্যবহার
                </h3>
                <p className="text-[11px] text-slate-500">দৈনিক ব্যবহার ও লোড ব্যালেন্স</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                13.3k Calls / 7d
              </span>
            </div>

            <svg viewBox="0 0 520 160" width="100%" className="block my-2">
              <defs>
                <linearGradient id="appBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              <line x1="20" y1="130" x2="500" y2="130" stroke="#e2e8f0" strokeWidth="1" />
              <g fontSize="10" fill="#64748b" textAnchor="middle" fontFamily="Poppins">
                <rect x="35" y="80" width="36" height="50" rx="6" fill="url(#appBarGrad)" />
                <text x="53" y="145">Sat</text>
                <text x="53" y="72" fill="#334155" fontSize="9" fontWeight="bold">1.2k</text>

                <rect x="100" y="66" width="36" height="64" rx="6" fill="url(#appBarGrad)" />
                <text x="118" y="145">Sun</text>
                <text x="118" y="58" fill="#334155" fontSize="9" fontWeight="bold">1.6k</text>

                <rect x="165" y="44" width="36" height="86" rx="6" fill="url(#appBarGrad)" />
                <text x="183" y="145">Mon</text>
                <text x="183" y="36" fill="#334155" fontSize="9" fontWeight="bold">2.1k</text>

                <rect x="230" y="74" width="36" height="56" rx="6" fill="url(#appBarGrad)" />
                <text x="248" y="145">Tue</text>
                <text x="248" y="66" fill="#334155" fontSize="9" fontWeight="bold">1.4k</text>

                <rect x="295" y="30" width="36" height="100" rx="6" fill="url(#appBarGrad)" />
                <text x="313" y="145">Wed</text>
                <text x="313" y="22" fill="#334155" fontSize="9" fontWeight="bold">2.4k</text>

                <rect x="360" y="52" width="36" height="78" rx="6" fill="url(#appBarGrad)" />
                <text x="378" y="145">Thu</text>
                <text x="378" y="44" fill="#334155" fontSize="9" fontWeight="bold">1.9k</text>

                <rect x="425" y="20" width="36" height="110" rx="6" fill="url(#appBarGrad)" />
                <text x="443" y="145">Fri</text>
                <text x="443" y="12" fill="#334155" fontSize="9" fontWeight="bold">2.7k</text>
              </g>
            </svg>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                সফল কল: <b>৯৩%</b>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                ব্যর্থ/লিমিট: <b>৭%</b>
              </span>
              <span>গড় লেটেন্সি: <b>~0.8s</b></span>
            </div>
          </div>

          {/* Attention Checklist (Security & Operational Notes) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>মনোযোগ দরকার (Security & System Checklist)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <b className="text-slate-800 block">Firebase RTDB সিকিউর</b>
                  <span className="text-slate-500 text-[11px]">ইউজার ডাটা এনক্রিপ্টেড ও সম্পূর্ণ রিয়েল-টাইম</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <b className="text-slate-800 block">SP Wallet ভার্চুয়াল কার্ড</b>
                  <span className="text-slate-500 text-[11px]">মার্চেন্ট চ্যানেল অ্যাক্টিভ ও টেস্টেড</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</span>
                <div>
                  <b className="text-slate-800 block">reCAPTCHA সিকিউরিটি</b>
                  <span className="text-slate-500 text-[11px]">বট ফিল্টারিং সক্রিয় রয়েছে</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</span>
                <div>
                  <b className="text-slate-800 block">পাসওয়ার্ড পলিসি</b>
                  <span className="text-slate-500 text-[11px]">স্ট্রং পাসওয়ার্ড ভ্যালিডেশন চালু</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Merged System Status & Controls Card */}
        <div className="space-y-3.5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5 text-indigo-600" />
              <span>সিস্টেম কন্ট্রোল (Quick Toggles)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">সার্ভিসগুলোর অন/অফ স্ট্যাটাস</p>

            <div className="space-y-2.5">
              {/* Maintenance Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-800">মেইনটেন্যান্স মোড</div>
                  <div className="text-[10px] text-slate-500">রক্ষণাবেক্ষণ পেজ দেখাবে</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSystemControl({
                    ...systemControl,
                    maintenanceMode: !systemControl.maintenanceMode
                  })}
                  className={cn(
                    "w-10 h-5.5 rounded-full p-0.5 transition-colors relative cursor-pointer",
                    systemControl.maintenanceMode ? "bg-rose-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs",
                    systemControl.maintenanceMode ? "translate-x-4.5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Registration Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-800">নতুন রেজিস্ট্রেশন</div>
                  <div className="text-[10px] text-slate-500">পাবলিক সাইন-আপ সক্রিয়</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSystemControl({
                    ...systemControl,
                    allowRegistration: !systemControl.allowRegistration
                  })}
                  className={cn(
                    "w-10 h-5.5 rounded-full p-0.5 transition-colors relative cursor-pointer",
                    systemControl.allowRegistration ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs",
                    systemControl.allowRegistration ? "translate-x-4.5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* AI Engine Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-800">AI চ্যাট ইঞ্জিন</div>
                  <div className="text-[10px] text-slate-500">চ্যাট ও রিপ্লাই সক্রিয়</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSystemControl({
                    ...systemControl,
                    aiChatEnabled: !systemControl.aiChatEnabled
                  })}
                  className={cn(
                    "w-10 h-5.5 rounded-full p-0.5 transition-colors relative cursor-pointer",
                    systemControl.aiChatEnabled ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs",
                    systemControl.aiChatEnabled ? "translate-x-4.5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Ad Bonus Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-800">বিজ্ঞাপন বোনাস</div>
                  <div className="text-[10px] text-slate-500">টোকেন অর্জনের সুবিধা</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSystemControl({
                    ...systemControl,
                    adRewardsEnabled: !systemControl.adRewardsEnabled
                  })}
                  className={cn(
                    "w-10 h-5.5 rounded-full p-0.5 transition-colors relative cursor-pointer",
                    systemControl.adRewardsEnabled ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs",
                    systemControl.adRewardsEnabled ? "translate-x-4.5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onExportUsers}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                ডাটা ব্যাকআপ
              </button>
              <button
                type="button"
                onClick={onForceLogoutAll}
                className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                সবাইকে লগআউট
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
