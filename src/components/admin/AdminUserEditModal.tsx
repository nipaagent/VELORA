import React, { useState } from 'react';
import { User, X, Shield, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AdminUser } from './adminTypes';

interface AdminUserEditModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (uid: string, data: Partial<AdminUser>) => Promise<void>;
  isSaving: boolean;
}

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSaveUser,
  isSaving
}) => {
  if (!isOpen || !user) return null;

  const [fullName, setFullName] = useState(user.fullName || '');
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState(user.password || '');
  const [role, setRole] = useState<'user' | 'admin'>(user.role === 'admin' ? 'admin' : 'user');
  const [status, setStatus] = useState<'pending' | 'banned' | 'approved'>(
    user.status || (user.isBanned ? 'banned' : 'approved')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('ইউজারনেম আবশ্যক!');
      return;
    }

    await onSaveUser(user.uid, {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      status: status as any,
      isBanned: status === 'banned'
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
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">ইউজার প্রোফাইল সম্পাদনা</h3>
                <p className="text-[11px] text-slate-500">UID: {user.uid.slice(0, 16)}...</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">সম্পূর্ণ নাম (Full Name)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">ইউজারনেম (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>পাসওয়ার্ড (Password)</span>
                <span className="text-[10px] text-indigo-600 font-semibold">সরাসরি ডেটাবেসে পরিবর্তন হবে</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ভূমিকা (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="user">সাধারণ ইউজার (User)</option>
                  <option value="admin">সুপার অ্যাডমিন (Admin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">অ্যাকাউন্ট স্ট্যাটাস</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'banned' | 'approved')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="banned">ব্যানড (Banned)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
