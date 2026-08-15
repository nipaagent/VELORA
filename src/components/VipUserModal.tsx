import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Clock, Sparkles, ShieldAlert, X, Loader2, Calendar, Check } from 'lucide-react';
import { AdminUser } from './AdminPage';

interface VipUserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSetVipDuration: (days: number | 'lifetime' | 0) => Promise<void>;
  isSaving: boolean;
}

export const VipUserModal: React.FC<VipUserModalProps> = ({
  user,
  onClose,
  onSetVipDuration,
  isSaving
}) => {
  const [customDaysInput, setCustomDaysInput] = useState<string>('');

  if (!user) return null;

  const isVipActive = Boolean((user.vipExpiresAt && user.vipExpiresAt > Date.now()) || (user.isVip && (!user.vipExpiresAt || user.vipExpiresAt === 0)));
  const isLifetime = user.isVip && (!user.vipExpiresAt || user.vipExpiresAt >= 2000000000000);
  
  const remainingDays = user.vipExpiresAt && user.vipExpiresAt > Date.now() && user.vipExpiresAt < 2000000000000
    ? Math.max(1, Math.ceil((user.vipExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleApplyCustomDays = () => {
    const daysNum = parseInt(customDaysInput, 10);
    if (!isNaN(daysNum) && daysNum > 0) {
      onSetVipDuration(daysNum);
      setCustomDaysInput('');
    }
  };

  const presetOptions = [
    { label: '১ দিন', days: 1 },
    { label: '২ দিন', days: 2 },
    { label: '৫ দিন', days: 5 },
    { label: '১০ দিন', days: 10 },
    { label: '৩০ দিন', days: 30 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 w-full max-w-lg overflow-hidden flex flex-col text-slate-100 z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                <Crown className="w-5 h-5 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <h3 className="font-black text-amber-300 text-base sm:text-lg leading-tight flex items-center gap-2">
                  <span>প্রিমিয়াম (VIP) কন্ট্রোল প্যানেল</span>
                </h3>
                <p className="text-xs font-semibold text-slate-300">
                  {user.fullName} (@{user.username})
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto">
            
            {/* Current VIP Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">বর্তমান প্রিমিয়াম স্ট্যাটাস:</span>
                {isVipActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 border border-amber-400 text-amber-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                    <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    {isLifetime
                      ? 'সক্রিয় (লাইফটাইম / সারা জীবন)'
                      : `সক্রিয় (${remainingDays} দিন বাকি)`}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    নরমাল ইউজার (ফ্রি)
                  </span>
                )}
              </div>

              {user.vipExpiresAt && user.vipExpiresAt > Date.now() && user.vipExpiresAt < 2000000000000 && (
                <p className="text-[11px] text-amber-200/80 font-mono pt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  মেয়াদ শেষ হবে: {new Date(user.vipExpiresAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Quick Preset Buttons (1, 2, 5, 10, 30 days) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                মেয়াদ নির্বাচন করুন (Select Duration):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presetOptions.map((opt) => (
                  <motion.button
                    key={opt.days}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    onClick={() => onSetVipDuration(opt.days)}
                    className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-amber-500/30 hover:border-amber-400/60 text-white font-bold text-xs flex flex-col justify-between transition-all cursor-pointer shadow-xs disabled:opacity-50 text-left"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-amber-300 text-sm">{opt.label}</span>
                    </div>
                  </motion.button>
                ))}

                {/* Lifetime Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  onClick={() => onSetVipDuration('lifetime')}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-600/25 hover:from-amber-500/35 hover:to-yellow-500/35 border border-amber-400 text-white font-bold text-xs flex flex-col justify-between transition-all cursor-pointer shadow-md disabled:opacity-50 text-left sm:col-span-1"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-amber-300 text-xs flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      লাইফটাইম
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Custom Days Input Option */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>যেকোনো ইচ্ছেমতো দিন লিখে প্রিমিয়াম দিন (Custom Days):</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={customDaysInput}
                  onChange={(e) => setCustomDaysInput(e.target.value)}
                  placeholder="যেমন: ৩, ৭, ১৫, ২০, ৪৫ দিন..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={isSaving || !customDaysInput || parseInt(customDaysInput, 10) <= 0}
                  onClick={handleApplyCustomDays}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>সেট করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cancel/Revoke Option */}
            {isVipActive && (
              <div className="pt-2 border-t border-slate-800">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isSaving}
                  onClick={() => onSetVipDuration(0)}
                  className="w-full p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <div className="text-left">
                      <div className="font-extrabold text-rose-300">প্রিমিয়াম বাতিল করুন (Cancel Premium)</div>
                      <div className="text-[10px] text-rose-300/70 font-normal">ইউজারের প্রিমিয়াম সুবিধা নিষ্ক্রিয় করুন</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-lg text-[10px] font-black">
                    বাতিল
                  </span>
                </motion.button>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
