import React, { useState } from 'react';
import { UserPlus, X, Shield, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser } from './adminTypes';

interface AdminAddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (userData: {
    fullName: string;
    username: string;
    password: string;
    role: 'user' | 'admin';
    initialTokens: number;
    isVip: boolean;
    vipDays: number;
  }) => Promise<void>;
  isSaving: boolean;
}

export const AdminAddUserModal: React.FC<AdminAddUserModalProps> = ({
  isOpen,
  onClose,
  onCreateUser,
  isSaving
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [initialTokens, setInitialTokens] = useState('50000');
  const [isVip, setIsVip] = useState(false);
  const [vipDays, setVipDays] = useState('30');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন!');
      return;
    }

    await onCreateUser({
      fullName: fullName.trim() || username.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      initialTokens: Number(initialTokens) || 50000,
      isVip,
      vipDays: isVip ? Number(vipDays) || 30 : 0
    });

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
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">নতুন ইউজার অ্যাকাউন্ট তৈরি করুন</h3>
                <p className="text-[11px] text-slate-500">সরাসরি ডেটাবেসে অ্যাকাউন্ট সেভ হবে</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">সম্পূর্ণ নাম (ঐচ্ছিক)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="যেমন: সাকিব আহমেদ"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ইউজারনেম *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="sakib12"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">পাসওয়ার্ড *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ভূমিকা (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="user">সাধারণ ইউজার</option>
                  <option value="admin">সুপার অ্যাডমিন</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">শুরুর টোকেন</label>
                <input
                  type="number"
                  value={initialTokens}
                  onChange={(e) => setInitialTokens(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
                />
                <span className="text-xs font-bold text-purple-900">👑 সরাসরি ভিআইপি সদস্যপদ দিন</span>
              </label>

              {isVip && (
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">ভিআইপি মেয়াদ (দিন)</label>
                  <input
                    type="number"
                    value={vipDays}
                    onChange={(e) => setVipDays(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-purple-800"
                  />
                </div>
              )}
            </div>

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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
