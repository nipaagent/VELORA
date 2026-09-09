import React from 'react';
import { 
  ShieldCheck, Users, Crown, Ban, Zap, 
  KeyRound, ArrowLeft, LogOut, Radio, 
  FileDown, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatTokenCount } from '../../lib/utils';
import { AdminUser } from './adminTypes';

interface AdminHeaderProps {
  users: AdminUser[];
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onBackToChat?: () => void;
  onForceLogoutAll: () => void;
  isLoggingOutAll: boolean;
  onExportUsers: () => void;
  apiKeyCount: number;
  maintenanceMode: boolean;
  onToggleMaintenance: () => void;
  adLinksCount: number;
  redeemCodesCount: number;
  logsCount: number;
  hasActiveAnnouncement: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  users,
  activeTab,
  onSelectTab,
  onBackToChat,
  onForceLogoutAll,
  isLoggingOutAll,
  onExportUsers,
  apiKeyCount,
  maintenanceMode,
  onToggleMaintenance,
  adLinksCount,
  redeemCodesCount,
  logsCount,
  hasActiveAnnouncement
}) => {
  const vipCount = users.filter(u => 
    (u.vipExpiresAt && u.vipExpiresAt > Date.now()) || (u.isVip && (!u.vipExpiresAt || u.vipExpiresAt === 0))
  ).length;

  const bannedCount = users.filter(u => u.isBanned || u.status === 'banned').length;

  const totalTokensDistributed = users.reduce((acc, u) => {
    const daily = u.tokenState?.maxDailyTokens ?? 50000;
    const bonus = u.tokenState?.bonusTokens ?? 0;
    return acc + daily + bonus;
  }, 0);

  const tabs = [
    { id: 'users', label: 'ইউজার ডিরেক্টরি', icon: Users, count: users.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'broadcast', label: 'সিস্টেম ব্রডকাস্ট', icon: Radio, count: hasActiveAnnouncement ? 1 : 0, color: 'text-rose-600 bg-rose-50 border-rose-200', alert: hasActiveAnnouncement },
    { id: 'tokens', label: 'টোকেন ও এড কনফিগ', icon: Zap, count: adLinksCount, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'redeem', label: 'রিডিম কোডস', icon: Crown, count: redeemCodesCount, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'security', label: 'সিকিউরিটি ও সিস্টেম', icon: ShieldCheck, count: maintenanceMode ? 1 : 0, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', alert: maintenanceMode },
    { id: 'apikeys', label: 'API গেটওয়ে', icon: KeyRound, count: apiKeyCount, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'logs', label: 'অডিট লগস', icon: RefreshCw, count: logsCount, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 border border-indigo-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  FIREBASE RTDB • 100% REALTIME COMMAND
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                VELORA MASTER CONTROL
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v3.8 PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Action Commands */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleMaintenance}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border shadow-sm cursor-pointer",
                maintenanceMode
                  ? "bg-rose-500/20 border-rose-500 text-rose-300 hover:bg-rose-500/30 animate-pulse"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              title="মেইনটেন্যান্স মোড টগল করুন"
            >
              <AlertTriangle className={cn("w-3.5 h-3.5", maintenanceMode ? "text-rose-400" : "text-slate-400")} />
              <span>{maintenanceMode ? 'মেইনটেন্যান্স চালু' : 'মেইনটেন্যান্স বন্ধ'}</span>
            </button>

            <button
              onClick={onExportUsers}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="ইউজার ডাটা JSON ব্যাকআপ ডাউনলোড"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>ডাটা এক্সপোর্ট</span>
            </button>

            <button
              onClick={onForceLogoutAll}
              disabled={isLoggingOutAll}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="সকল সাধারণ ইউজারকে তাৎক্ষণিক লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>সকলকে লগআউট</span>
            </button>

            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-700" />
                <span>চ্যাটে ফিরুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry Metric HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>মোট ইউজার</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {users.length} <span className="text-xs text-slate-400 font-normal">জন</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>ভিআইপি / প্রো</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 mt-1">
              {vipCount} <span className="text-xs text-slate-400 font-normal">অ্যাকাউন্ট</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>ব্যানড অ্যাকাউন্ট</span>
              <Ban className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">
              {bannedCount} <span className="text-xs text-slate-400 font-normal">ব্লকড</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>টোকেন রিজার্ভ</span>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 mt-1">
              {formatTokenCount(totalTokensDistributed)}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>AI গেটওয়ে কী</span>
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-300 mt-1 flex items-center gap-1.5">
              {apiKeyCount} <span className="text-xs text-slate-400 font-normal">Active</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>সার্ভার স্টেট</span>
              <span className={cn("w-2 h-2 rounded-full", maintenanceMode ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse")} />
            </div>
            <div className={cn("text-sm font-black mt-1.5 truncate", maintenanceMode ? "text-rose-400" : "text-emerald-400")}>
              {maintenanceMode ? 'মেইনটেন্যান্স' : '১০০% একটিভ'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500")} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-lg text-[10px] font-mono",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  {tab.count}
                </span>
              )}
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
