import React, { useState } from 'react';
import { Zap, X, Plus, Minus, RotateCcw, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatTokenCount } from '../../lib/utils';
import { AdminUser } from './adminTypes';

interface AdminUserTokenModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTokens: (
    uid: string, 
    action: 'add_bonus' | 'sub_bonus' | 'set_daily' | 'reset_used', 
    amount: number
  ) => Promise<void>;
  isSaving: boolean;
}

export const AdminUserTokenModal: React.FC<AdminUserTokenModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateTokens,
  isSaving
}) => {
  const [amount, setAmount] = useState('50000');
  const [actionType, setActionType] = useState<'add_bonus' | 'sub_bonus' | 'set_daily' | 'reset_used'>('add_bonus');

  if (!isOpen || !user) return null;

  const currentDaily = user.tokenState?.maxDailyTokens ?? 50000;
  const currentBonus = user.tokenState?.bonusTokens ?? 0;
  const currentUsed = user.tokenState?.tokensUsedToday ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateTokens(user.uid, actionType, Number(amount) || 0);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">টোকেন কন্ট্রোল প্যানেল</h3>
                <p className="text-[11px] text-slate-500">{user.fullName || user.username} (@{user.username})</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current balance stats */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">ডেইলি লিমিট</span>
              <span className="text-xs font-mono font-black text-slate-800">{formatTokenCount(currentDaily)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">বোনাস টোকেন</span>
              <span className="text-xs font-mono font-black text-purple-600">+{formatTokenCount(currentBonus)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">আজকে ব্যবহৃত</span>
              <span className="text-xs font-mono font-black text-amber-600">{formatTokenCount(currentUsed)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">অ্যাকশন নির্বাচন করুন</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('add_bonus')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    actionType === 'add_bonus'
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>বোনাস যোগ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('sub_bonus')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    actionType === 'sub_bonus'
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>টোকেন কেটে নিন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('set_daily')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    actionType === 'set_daily'
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>নতুন ডেইলি লিমিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('reset_used')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    actionType === 'reset_used'
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ব্যবহৃত রিসেট করুন</span>
                </button>
              </div>
            </div>

            {actionType !== 'reset_used' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">টোকেনের পরিমাণ</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="৫০,০০০"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[10000, 50000, 100000, 500000].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v.toString())}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 font-bold rounded cursor-pointer"
                    >
                      {formatTokenCount(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'আপডেট হচ্ছে...' : 'আপডেট সম্পন্ন করুন'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
