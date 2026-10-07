import React from 'react';
import { 
  KeyRound, Cpu, CheckCircle2, AlertCircle, 
  RefreshCw, Zap, Activity, HardDrive 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ApiKeyDetail } from './adminTypes';

interface AdminApiKeysTabProps {
  apiKeys: ApiKeyDetail[];
  totalCallsToday: number;
  totalCallsAllTime: number;
  activeModelName: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AdminApiKeysTab: React.FC<AdminApiKeysTabProps> = ({
  apiKeys,
  totalCallsToday,
  totalCallsAllTime,
  activeModelName,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                AI গেটওয়ে ও API কী ম্যানেজমেন্ট ({apiKeys.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unorouter ও Naga AI ক্লাউড গেটওয়ে এবং API ক্লাস্টারের লাইভ স্টেটাস।
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-sky-600")} />
            <span>গেটওয়ে রিফ্রেশ</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
              <span>আজকের মোট কলস</span>
              <Activity className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {totalCallsToday} <span className="text-xs font-normal text-slate-400">requests</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
              <span>সর্বমোট সার্ভ রিকোয়েস্ট</span>
              <Zap className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {totalCallsAllTime} <span className="text-xs font-normal text-slate-400">requests</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
              <span>সক্রিয় কোর মডেল</span>
              <Cpu className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base font-black text-emerald-700 mt-1 font-mono truncate">
              {activeModelName || 'Naga AI Core'}
            </div>
          </div>
        </div>

        {/* Key status cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            কনফিগার করা API কি সমূহ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {apiKeys.map((key, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs font-black text-slate-900">
                      {key.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {key.status || 'Active'}
                  </span>
                </div>

                <div className="font-mono text-xs bg-slate-50 px-3 py-2 rounded-xl text-slate-600 border border-slate-100 flex items-center justify-between">
                  <span>{key.maskedValue || 'naga-••••••••••••••••••••••••••'}</span>
                  <span className="text-[10px] text-slate-400">SECURE MASK</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-500 font-medium">
                  <div>
                    <span>আজকের ব্যবহার: </span>
                    <span className="font-bold text-slate-800">{key.todayCalls || 0}</span>
                  </div>
                  <div>
                    <span>সফলতার হার: </span>
                    <span className="font-bold text-emerald-600">
                      {key.totalCalls ? Math.round(((key.successCalls || 0) / key.totalCalls) * 100) : 100}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
