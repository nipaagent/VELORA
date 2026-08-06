import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Key, Save, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Code2, Zap, Lock, BadgeCheck, Cpu, Clock } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import UserAvatar from './UserAvatar';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Crown } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function ProfilePage({ onBack, userProfile, onUpdateProfile }: ProfilePageProps) {
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
    }
  }, [userProfile]);

  if (!userProfile) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess('');
    setNameError('');

    if (!fullName.trim()) {
      setNameError('Please enter your name.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSavingName(true);
    
    try {
      await update(ref(db, `users/${currentUser.uid}`), {
        fullName: fullName.trim()
      });

      const updatedProfile: UserProfile = {
        ...userProfile,
        fullName: fullName.trim(),
      };

      localStorage.setItem(`velora-profile-${currentUser.uid}`, JSON.stringify(updatedProfile));
      onUpdateProfile(updatedProfile);

      setNameSuccess('Name updated successfully!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err: any) {
      console.error("Name update error:", err);
      setNameError('Failed to update name, please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setPassError('User session error. Please log in again.');
      return;
    }

    setUpdatingPass(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      // Realtime DB update so Admin Panel reflects changed password instantly
      try {
        await update(ref(db, `users/${user.uid}`), {
          fullName: fullName.trim() || userProfile.fullName,
          password: newPassword,
          updatedAt: Date.now()
        });
      } catch (dbErr) {
        console.warn("RTDB password update notice:", dbErr);
      }

      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassSuccess(''), 3500);
    } catch (err: any) {
      console.error("Password update error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassError('Incorrect current password.');
      } else {
        setPassError(err.message || 'Failed to update password.');
      }
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        exit: { opacity: 0 }
      }}
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <motion.header 
        variants={{
          hidden: { y: -20, opacity: 0 },
          visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } }
        }}
        className="h-14 flex items-center px-4 bg-white border-b border-gray-100 shrink-0 z-10 relative"
      >
        <div className="flex-1 flex justify-start items-center gap-2">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 -ml-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors focus:ring-2 focus:ring-gray-200 outline-none flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back"
            title="Back to Chat"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
            <span>Back</span>
          </motion.button>
        </div>
        
        <div className="flex items-center justify-center gap-1.5 flex-1">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--user-theme-color)' }} />
          <h1 className="text-base font-bold text-gray-900 tracking-wider uppercase">VELORA</h1>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 font-mono"
          >
            @{userProfile.username}
          </motion.span>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 sm:p-8 md:p-12 space-y-6 bg-white">
        
        {/* User Card */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
          }}
          className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 flex items-center gap-4 relative overflow-hidden"
        >
          {(() => {
            const isVipActive = Boolean(userProfile.isVip || (userProfile.vipExpiresAt && userProfile.vipExpiresAt > Date.now()));
            return (
              <>
                <div className="relative">
                  <UserAvatar name={userProfile.fullName || userProfile.username} size="lg" />
                  {isVipActive && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-1 -right-1 bg-amber-400 p-1 rounded-full shadow-lg border-2 border-white"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{userProfile.fullName || 'User'}</h2>
                    {isVipActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] uppercase tracking-wider animate-pulse">
                        <Crown className="w-3 h-3 fill-amber-950" />
                        VIP Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                        <BadgeCheck className="w-3 h-3" />
                        Verified User
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono">@{userProfile.username}</p>
                  
                  {isVipActive && (
                    <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {userProfile.vipExpiresAt && userProfile.vipExpiresAt < 2000000000000
                        ? `মেয়াদ: ${new Date(userProfile.vipExpiresAt).toLocaleDateString()} পর্যন্ত`
                        : 'লাইফটাইম মেম্বারশিপ সক্রিয়'}
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </motion.div>



        {/* Account Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Edit Name Section */}
          <motion.section 
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
            }}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm pb-2.5 border-b border-gray-100">
                <User className="w-4 h-4" style={{ color: 'var(--user-theme-color)' }} />
                <span>Change Name</span>
              </div>

              {nameSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{nameSuccess}</span>
                </motion.div>
              )}

              {nameError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{nameError}</span>
                </motion.div>
              )}

              <form id="nameForm" onSubmit={handleSaveName} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${userProfile.username}`}
                    className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your new name"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                form="nameForm"
                disabled={savingName || fullName.trim() === userProfile.fullName}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Name
              </motion.button>
            </div>
          </motion.section>

          {/* Change Password Section */}
          <motion.section 
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
            }}
            className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm pb-2.5 border-b border-gray-100">
                <Key className="w-4 h-4" style={{ color: 'var(--user-theme-color)' }} />
                <span>Change Password</span>
              </div>

              {passSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </motion.div>
              )}

              {passError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{passError}</span>
                </motion.div>
              )}

              <form id="passForm" onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3 pr-9 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3 pr-9 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                form="passForm"
                disabled={updatingPass || !currentPassword || !newPassword}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Update Password
              </motion.button>
            </div>
          </motion.section>

        </div>

        {/* VELORA Features Section */}
        <motion.section 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
          }}
          className="bg-gray-50 rounded-2xl p-5 border border-gray-200/90 space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">VELORA — Intelligent Capabilities</h3>
              <p className="text-[11px] text-gray-500">Fast, accurate, and reliable AI assistance for any task</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Instant Responses</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                VELORA delivers rapid, accurate answers to casual, analytical, or academic queries.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Advanced Coding</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Write clean, properly formatted, fully functional code blocks with copy support.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Secure & Encrypted</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Your profile credentials and chat history are safely stored with modern encryption.
              </p>
            </motion.div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <span className="text-[11px] font-medium text-gray-600">VELORA AI Assistant — Version 1.0.0</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Back to Chat
            </motion.button>
          </div>
        </motion.section>

      </main>
    </motion.div>
  );
}
