import React from 'react';
import { ShieldAlert, Sparkles, LogIn, Cpu, Lock, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface MaintenancePageProps {
  onOpenAdminAuth: () => void;
}

export default function MaintenancePage({ onOpenAdminAuth }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <span className="text-lg font-black tracking-widest uppercase text-white font-mono">
            NIPA <span className="text-[10px] font-normal text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10 ml-1">V2.7</span>
          </span>
        </div>

        <button
          onClick={onOpenAdminAuth}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-400" />
          <span>অ্যাডমিন লগইন</span>
        </button>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-7 sm:p-10 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          {/* Animated Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>সিস্টেম মেইনটেন্যান্স মোড</span>
          </div>

          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            NIPA শীঘ্রই ফিরে আসছে
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto font-medium">
            সার্ভার স্পিড অপটিমাইজেশন ও AI ক্লাউড ইঞ্জিনের বাৎসরিক রক্ষণাবেক্ষণের কাজ চলছে। সাধারণ চ্যাট ও নতুন অ্যাকাউন্ট রেজিস্ট্রেসন সাময়িকভাবে বন্ধ রয়েছে।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আনুমানিক সময়</div>
                <div className="text-xs font-bold text-slate-200">খুব শীঘ্রই সচল হবে</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ইউজার ডাটা</div>
                <div className="text-xs font-bold text-slate-200">১০০% নিরাপদ ও অক্ষত</div>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAdminAuth}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            <span>অ্যাডমিন প্যানেলে প্রবেশ করুন</span>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 relative z-10 font-mono">
        NIPA NETWORK V2.7 · NIPA SOLUTIONS · All Rights Reserved
      </footer>
    </div>
  );
}
