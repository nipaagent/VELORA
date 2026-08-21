import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lightbulb, Info, User, Key, Save, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Code2, Zap, Lock, BadgeCheck, Cpu, Clock, Copy, Share2, Gift, Download, Upload, Database, Edit2, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import UserAvatar from './UserAvatar';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsPageProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  currentView: 'main' | 'profile' | 'referral' | 'data' | 'tips';
  onNavigateView: (view: 'main' | 'profile' | 'referral' | 'data' | 'tips') => void;
  onOpenDeveloper?: () => void;
}

export default function SettingsPage({ onBack, userProfile, onUpdateProfile, currentView, onNavigateView, onOpenDeveloper }: SettingsPageProps) {
  const [fullName, setFullName] = useState('');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
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

  const [copyingCode, setCopyingCode] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  useEffect(() => {
    if (userProfile?.fullName) {
      setFullName(userProfile.fullName);
    }
    if (userProfile?.avatarIndex !== undefined) {
      setSelectedAvatarIndex(userProfile.avatarIndex);
    }
  }, [userProfile]);

  const handleCopyCode = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopyingCode(true);
    setTimeout(() => setCopyingCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!userProfile?.referralCode) return;
    const link = `${window.location.origin}/?ref=${userProfile.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopyingLink(true);
    setTimeout(() => setCopyingLink(false), 2000);
  };

  const handleExportData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snapshot = await get(ref(db, `chats/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `velora-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("কোনো চ্যাট ডেটা পাওয়া যায়নি!");
      }
    } catch (e) {
      console.error("Export error:", e);
      alert("ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে।");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let data = JSON.parse(text);
        
        const user = auth.currentUser;
        if (!user) return;

        let processedData: Record<string, any> = {};

        if (Array.isArray(data)) {
          data.forEach((chat: any) => {
            if (chat && chat.id) {
              processedData[chat.id] = chat;
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          processedData = data;
        } else {
          throw new Error("Invalid format");
        }

        await update(ref(db, `chats/${user.uid}`), processedData);
        alert("ডেটা সফলভাবে ইমপোর্ট হয়েছে!");
        window.location.reload();
      } catch (e) {
        console.error("Import parse error:", e);
        alert("ভুল ফাইল ফরম্যাট! দয়া করে সঠিক JSON ফাইল নির্বাচন করুন।");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRedeemReferral = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) return;
    if (!userProfile) return;

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

      const currentBonus = (userProfile.tokenState?.bonusTokens || 0);
      const userUpdates: any = {
        'tokenState/bonusTokens': currentBonus + 50000,
        'referredBy': referrer.uid,
        'referredByCode': code,
        'referredByName': referrer.fullName || referrer.username
      };
      
      await update(currentUserRef, userUpdates);

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

  
  const handleAvatarSelect = async (idx: number) => {
    setSelectedAvatarIndex(idx);
    if (!userProfile) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await update(ref(db, `users/${currentUser.uid}`), {
        avatarIndex: idx
      });
      const updatedProfile: UserProfile = {
        ...userProfile,
        avatarIndex: idx,
      };
      localStorage.setItem(`velora-profile-${currentUser.uid}`, JSON.stringify(updatedProfile));
      onUpdateProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update avatar index', error);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess('');
    setNameError('');
    if (!userProfile) return;

    if (!fullName.trim()) {
      setNameError('Please enter your name.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSavingName(true);
    
    try {
      await update(ref(db, `users/${currentUser.uid}`), {
        fullName: fullName.trim(),
        // avatarIndex: selectedAvatarIndex
      });

      const updatedProfile: UserProfile = {
        ...userProfile,
        fullName: fullName.trim(),
        // avatarIndex: selectedAvatarIndex,
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
    if (!userProfile) return;

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

  const tabs = [
    { id: 'profile', label: 'Account Details', icon: User },
    { id: 'referral', label: 'Refer & Earn', icon: Gift },
    { id: 'data', label: 'Data Export / Import', icon: Database },
    { id: 'developer', label: 'Developer Hub', icon: Code2 },
    { id: 'tips', label: 'Tips & Updates', icon: Lightbulb }
  ];

  if (!userProfile) return null;

  return (
    <div className="h-full bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col relative">
      <AnimatePresence mode="wait">
        {currentView === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5"
          >
            <div className="flex flex-col items-center pt-6 pb-6 shrink-0 relative">
              <div className="relative">
                <UserAvatar name={userProfile.fullName || userProfile.username} avatarIndex={userProfile.avatarIndex || 0} size={84} showBorder={true} className="shadow-md ring-4 ring-white" />
                <button 
                  onClick={() => onNavigateView('profile')}
                  className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-4 tracking-tight">
                {userProfile.fullName || userProfile.username}
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                {auth.currentUser?.email}
              </p>
            </div>

            <div className="space-y-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'developer') {
                      onOpenDeveloper?.();
                    } else {
                      onNavigateView(tab.id as any);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200/60 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] hover:border-indigo-100 transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors shadow-sm">
                      <tab.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 tracking-tight">{tab.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5 space-y-4"
          >
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-slate-500" /> Account Details
            </h3><div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-slate-50/50">
                {nameSuccess && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{nameSuccess}</span>
                  </div>
                )}
                {nameError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{nameError}</span>
                  </div>
                )}
                
                
                <div className="mb-6">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3 ml-1">
                    Choose Profile Avatar
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAvatarSelect(idx)}
                        className={`relative transition-all duration-300 rounded-full ${selectedAvatarIndex === idx ? 'ring-4 ring-indigo-500 ring-offset-2 scale-110 shadow-lg' : 'hover:scale-105 hover:shadow-md'}`}
                      >
                        <UserAvatar name={fullName || userProfile.username} avatarIndex={idx} size={56} showBorder={false} />
                        {selectedAvatarIndex === idx && (
                          <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border-2 border-white z-10">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">
                      Display Name
                    </label>
                    <input
                      id="nameInput"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingName || fullName.trim() === (userProfile.fullName || '')}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </form>
              </div>

              <div className="p-4">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3 ml-1">Security & Password</h4>
                {passSuccess && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}
                {passError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min. 6 chars)"
                          className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingPass || !currentPassword || !newPassword}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {currentView === 'referral' && (
          <motion.div 
            key="referral"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5 space-y-4"
          >
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-amber-500" /> Refer & Earn
            </h3>
            
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Share2 className="w-24 h-24 rotate-12" />
              </div>
              
              <div className="relative z-10">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight mb-2">রেফার করুন, ভিআইপি হোন!</h3>
                <p className="text-indigo-100 text-sm leading-relaxed mb-6 max-w-sm">
                  আপনার রেফার কোড ব্যবহার করে কেউ একাউন্ট খুললে আপনি পাবেন <span className="font-bold text-white">১ লক্ষ টোকেন</span> এবং তারা পাবে <span className="font-bold text-white">৫০,০০০ টোকেন</span>।
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-3 py-2 flex items-center justify-between group/code overflow-hidden">
                      <span className="font-mono font-bold text-lg tracking-wider mr-2">
                        {userProfile.referralCode || 'NOT_FOUND'}
                      </span>
                      <button 
                        onClick={handleCopyCode}
                        className="p-1.5 shrink-0 hover:bg-white/20 rounded-lg transition-colors text-indigo-100 hover:text-white"
                        title="Copy Code"
                      >
                        {copyingCode ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                      {copyingCode ? 'কপি হয়েছে' : 'কোড কপি করুন'}
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-3 py-2 flex items-center justify-between group/code overflow-hidden">
                      <span className="font-mono font-bold text-sm tracking-wide truncate mr-2" title={`${window.location.origin}/?ref=${userProfile.referralCode}`}>
                        {window.location.origin}/?ref={userProfile.referralCode || 'NOT_FOUND'}
                      </span>
                      <button 
                        onClick={handleCopyLink}
                        className="p-1.5 shrink-0 hover:bg-white/20 rounded-lg transition-colors text-indigo-100 hover:text-white"
                        title="Copy Link"
                      >
                        {copyingLink ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap"
                    >
                      {copyingLink ? 'কপি হয়েছে' : 'লিংক কপি করুন'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      রেফারেল মাইলস্টোন (VIP Rewards)
                    </h4>
                    <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
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
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">{m.label}</div>
                          <div className="text-sm font-black">{m.days} দিন VIP</div>
                          {isAchieved && <CheckCircle2 className="w-4 h-4 mx-auto mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {userProfile.referredBy ? (
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center mt-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                <h3 className="text-lg font-black text-emerald-900 tracking-tight">আপনি রেফার কোড ব্যবহার করেছেন</h3>
                <p className="text-sm text-emerald-700 mt-1 font-medium">
                  আপনি সফলভাবে রেফারেল বোনাস গ্রহণ করেছেন।
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <Zap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">রেফার কোড ব্যবহার করুন</h3>
                    <p className="text-sm text-gray-500">অন্য কারো কোড ব্যবহার করে ৫০,০০০ টোকেন পান</p>
                  </div>
                </div>
                
                {redeemSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {redeemSuccess}
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      placeholder="বন্ধুর রেফার কোড দিন (যেমন: ABC123)"
                      className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-mono uppercase tracking-widest"
                    />
                    <button
                      onClick={handleRedeemReferral}
                      disabled={redeeming || !redeemCode.trim()}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all shadow-md disabled:bg-gray-100 disabled:text-gray-400 flex justify-center items-center"
                    >
                      {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'অ্যাক্টিভেট'}
                    </button>
                  </div>
                  {redeemError && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-2 ml-1">
                      <AlertCircle className="w-4 h-4" /> {redeemError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentView === 'data' && (
          <motion.div 
            key="data"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5 space-y-4"
          >
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-blue-500" /> Data Management
            </h3>
            <div className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                আপনার সম্পূর্ণ চ্যাট হিস্ট্রি ডাউনলোড (Export) করে ব্যাকআপ রাখুন অথবা অন্য কোনো ডিভাইস থেকে চ্যাট হিস্ট্রি আপলোড (Import) করুন।
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportData}
                  className="w-full py-2.5 bg-white text-blue-700 border border-blue-200 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  এক্সপোর্ট করুন
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Import Data"
                  />
                  <div
                    className="w-full py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Upload className="w-5 h-5" />
                    ইমপোর্ট করুন
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      

        {currentView === 'tips' && (
          <motion.div 
            key="tips"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5 space-y-4"
          >
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Tips & Updates
            </h3>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
              <div className="p-5 bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    Coming Soon
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Velora v1.2</h2>
                  <p className="text-violet-100 text-sm leading-relaxed max-w-sm font-medium">
                    খুব শীঘ্রই আসছে নতুন আপডেটেড ভার্সন Velora v1.2! আপাতত এতে কোনো নতুন ফিচার যোগ হয়নি, তবে পরবর্তী দারুণ সব আপডেটের জন্য প্রস্তুত থাকুন।
                  </p>
                </div>
              </div>
            </div>
            
                        
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    New Release
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Velora v1.1</h2>
                  <p className="text-indigo-100 text-sm leading-relaxed max-w-sm font-medium">
                    এই আপডেটে নতুন ডিজাইন এবং ফিচার যুক্ত করা হয়েছে। আরও ভালোভাবে অ্যাপটি ব্যবহার করতে নিচের টিপসগুলো দেখে নিন।
                  </p>
                </div>
              </div>
              
              <div className="p-5 space-y-5">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">স্মার্ট সেটিংস মেনু</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      সেটিংস মেনুকে আরও সুন্দর এবং ব্যবহারবান্ধব করা হয়েছে। সবগুলো অপশন এখন আলাদা করে গুছিয়ে রাখা হয়েছে। বাটনগুলো এখন আরও কমপ্যাক্ট এবং বিস্তারিত।
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">কাস্টম ৩ডি প্রোফাইল প্যাক</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      আপনার নামের প্রথম অক্ষর দিয়ে তৈরি 3D অ্যাভাটারগুলো এখন কাস্টমাইজ করা যাবে। অ্যাকাউন্ট সেটিংস থেকে আপনার পছন্দের ৬টি আলাদা ডিজাইনের যেকোনো একটি সেট করতে পারবেন!
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Gift className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">রেফারেল সিস্টেম ফিক্স</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      যারা আগে রেফার কোড ব্যবহার করেছেন, তাদের ক্ষেত্রে এখন থেকে আর কোড বসানোর বক্স দেখাবে না। শুধুমাত্র সফলতার মেসেজ দেখাবে।
                    </p>
                  </div>
                </div>
                
                

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
