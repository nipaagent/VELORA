import React, { useState } from 'react';
import { 
  FileText, Search, Trash2, Clock, 
  ShieldCheck, ArrowUpDown, Filter, AlertCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdminLog } from './adminTypes';

interface AdminLogsTabProps {
  logs: AdminLog[];
  onClearLogs: () => Promise<void>;
  isClearing: boolean;
}

export const AdminLogsTab: React.FC<AdminLogsTabProps> = ({
  logs,
  onClearLogs,
  isClearing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const actions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                রিয়েলটাইম অ্যাডমিন অডিট ও অ্যাক্টিভিটি লগ ({logs.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                অ্যাডমিন প্যানেলে গৃহীত প্রতিটি গুরুত্বপূর্ণ পদক্ষেপ স্বয়ংক্রিয়ভাবে রেকর্ড হয়।
              </p>
            </div>
          </div>

          <button
            onClick={onClearLogs}
            disabled={isClearing || logs.length === 0}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'মুছে ফেলা হচ্ছে...' : 'লগ হিস্ট্রি ক্লিয়ার করুন'}</span>
          </button>
        </div>

        {/* Search and filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="লগ খুঁজুন (অ্যাকশন, বার্তা বা ইউজার)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <option value="ALL">সকল অ্যাকশন ({logs.length})</option>
              {actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Stream */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
              কোনো অডিট লগ পাওয়া যায়নি।
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-700 font-medium">
                      {log.description}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap font-mono flex items-center gap-1 shrink-0 pt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
