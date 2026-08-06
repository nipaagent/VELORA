import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Key, Save, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Code2, Zap, Lock, BadgeCheck, Cpu, Clock, Copy, Share2, Gift } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import UserAvatar from './UserAvatar';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Crown } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  scrollToReferral?: boolean;
}

export default function ProfilePage({ onBack, userProfile, onUpdateProfile, scrollToReferral }: ProfilePageProps) {
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
  const [copyingReferral, setCopyingReferral] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  const handleCopyReferral = () => {
    if (!userProfile.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopyingReferral(true);
    setTimeout(() => setCopyingReferral(false), 2000);
  };

    const handleRedeemReferral = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) return;

    if (userProfile.referredBy || userProfile.referredByCode) {
      setRedeemError('আপনি ইতিমধ্যে একটি রেফার কোড ব্যবহার করেছেন।');
      return;
    }

    if (code === userProfile.referralCode) {
      setRedeemError('আপনি নিজের কোড ব্যবহার করতে পারবেন না।');
      return;
    }
    
    setRedeeming(true);
    setRedeemError('');
    setRedeemSuccess('');

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (!snapshot.exists()) throw new Error('Users not found');
      
      const allUsers = snapshot.val();
      const referrer = Object.values(allUsers).find((u: any) => u.referralCode === code) as any;
      
      if (!referrer) {
        setRedeemError('ভুল রেফার কোড। অনুগ্রহ করে সঠিক কোড দিন।');
        setRedeeming(false);
        return;
      }

      const currentUserRef = ref(db, `users/${userProfile.uid}`);
      const referrerRef = ref(db, `users/${referrer.uid}`);

      // 1. Update Current User: +50k tokens, set referredBy
      const currentBonus = (userProfile.tokenState?.bonusTokens || 0);
      const userUpdates: any = {
        'tokenState/bonusTokens': currentBonus + 50000,
        'referredBy': referrer.uid,
        'referredByCode': code,
        'referredByName': referrer.fullName || referrer.username
      };
      
      await update(currentUserRef, userUpdates);

      // 2. Update Referrer: +100k tokens, increment count, check milestones
      const referrerBonus = (referrer.tokenState?.bonusTokens || 0);
      const newReferralCount = (referrer.referralCount || 0) + 1;
      
      let extraVipDays = 0;
      if (newReferralCount === 10) extraVipDays = 3;
      else if (newReferralCount === 20) extraVipDays = 10;
      else if (newReferralCount === 30) extraVipDays = 20;

      const referrerUpdates: any = {
        'tokenState/bonusTokens': referrerBonus + 100000,
        'referralCount': newReferralCount
      };

      if (extraVipDays > 0) {
        const currentVipExpiry = referrer.vipExpiresAt || 0;
        const baseTime = Math.max(currentVipExpiry, Date.now());
        referrerUpdates['vipExpiresAt'] = baseTime + (extraVipDays * 24 * 60 * 60 * 1000);
        referrerUpdates['isVip'] = true;
      }

      await update(referrerRef, referrerUpdates);

      setRedeemSuccess('রেফার কোড সফলভাবে ব্যবহার করা হয়েছে! আপনি ৫০,০০০ বোনাস টোকেন পেয়েছেন।');
      setRedeemCode('');
      
      // Update local state
      onUpdateProfile({
        ...userProfile,
        ...userUpdates,
        tokenState: {
          ...userProfile.tokenState!,
          bonusTokens: currentBonus + 50000
        }
      });

    } catch (err) {
      console.error(err);
      setRedeemError('কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    if (scrollToReferral) {
      setTimeout(() => {
        const element = document.getElementById('referral-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
    }
  }, [scrollToReferral]);

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

          {/* Referral & VIP Section */}
        <motion.div 
          id="referral-section"
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
          }}
          className="space-y-4"
        >
          {/* Your Referral Code Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Share2 className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">বন্ধুদের রেফার করুন</h3>
              </div>
              
              <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed mb-6 max-w-[280px]">
                আপনার রেফার কোড ব্যবহার করে কেউ একাউন্ট খুললে আপনি পাবেন <span className="font-bold text-white">১ লক্ষ টোকেন</span> এবং তারা পাবে <span className="font-bold text-white">৫০,০০০ টোকেন</span>।
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-4 py-3 flex items-center justify-between group/code">
                  <span className="font-mono font-black text-lg tracking-wider">
                    {userProfile.referralCode || 'NOT_FOUND'}
                  </span>
                  <button 
                    onClick={handleCopyReferral}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-100 hover:text-white"
                    title="Copy Code"
                  >
                    {copyingReferral ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                <button 
                  onClick={handleCopyReferral}
                  className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-50 active:scale-95 transition-all shadow-lg"
                >
                  {copyingReferral ? 'কপি হয়েছে' : 'রেফার কোড কপি করুন'}
                </button>
              </div>

              {/* Milestone Progress */}
              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    রেফারেল মাইলস্টোন (VIP Rewards)
                  </h4>
                  <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                    {userProfile.referralCount || 0} জন রেফারড
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { target: 10, days: 3, label: '১০ জন' },
                    { target: 20, days: 10, label: '২০ জন' },
                    { target: 30, days: 20, label: '৩০ জন' }
                  ].map((m) => {
                    const isAchieved = (userProfile.referralCount || 0) >= m.target;
                    return (
                      <div 
                        key={m.target}
                        className={cn(
                          "p-3 rounded-2xl border text-center transition-all",
                          isAchieved 
                            ? "bg-amber-400 border-amber-300 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]" 
                            : "bg-white/5 border-white/10 text-indigo-100"
                        )}
                      >
                        <div className="text-[10px] font-bold uppercase mb-1 opacity-80">{m.label}</div>
                        <div className="text-xs font-black">{m.days} দিন VIP</div>
                        {isAchieved && <CheckCircle2 className="w-3 h-3 mx-auto mt-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Redeem Referral Code Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">রেফার কোড ব্যবহার করুন</h3>
                <p className="text-xs text-gray-500">অন্য কারো কোড ব্যবহার করে ৫০,০০০ টোকেন পান</p>
              </div>
            </div>

            {userProfile.referredBy ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">কোড ব্যবহার করা হয়েছে!</p>
                  <p className="text-[10px] text-emerald-700">আপনি <span className="font-bold">{userProfile.referredByName}</span> এর রেফার কোড ({userProfile.referredByCode}) ব্যবহার করেছেন।</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="বন্ধুর রেফার কোড দিন (যেমন: ABC123)"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-mono uppercase"
                  />
                  <button
                    onClick={handleRedeemReferral}
                    disabled={redeeming || !redeemCode.trim()}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all shadow-md disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'অ্যাক্টিভেট'}
                  </button>
                </div>
                {redeemError && (
                  <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 ml-1">
                    <AlertCircle className="w-3 h-3" /> {redeemError}
                  </p>
                )}
                {redeemSuccess && (
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 ml-1">
                    <CheckCircle2 className="w-3 h-3" /> {redeemSuccess}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

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

      </main>
    </motion.div>
  );
}
