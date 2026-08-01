import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Key, Save, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Code2, Zap, Lock, BadgeCheck, Cpu, Globe, Activity } from 'lucide-react';
import { UserProfile, GatewayConfig } from '../types';
import { auth, db } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { motion } from 'motion/react';

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

  // Gateway specific states
  const [gwEnabled, setGwEnabled] = useState(false);
  const [gwBaseUrl, setGwBaseUrl] = useState('');
  const [gwApiKey, setGwApiKey] = useState('');
  const [gwAuthScheme, setGwAuthScheme] = useState<'x-api-key' | 'Bearer' | 'x-goog-api-key'>('x-api-key');
  const [gwModel, setGwModel] = useState('');
  
  const [savingGw, setSavingGw] = useState(false);
  const [gwSuccess, setGwSuccess] = useState('');
  const [gwError, setGwError] = useState('');
  
  const [testingGw, setTestingGw] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      if (userProfile.gatewayConfig) {
        setGwEnabled(userProfile.gatewayConfig.enabled);
        setGwBaseUrl(userProfile.gatewayConfig.baseUrl || '');
        setGwApiKey(userProfile.gatewayConfig.apiKey || '');
        setGwAuthScheme(userProfile.gatewayConfig.authScheme || 'x-api-key');
        setGwModel(userProfile.gatewayConfig.model || '');
      }
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
    const updatedProfile: UserProfile = {
      ...userProfile,
      fullName: fullName.trim(),
    };

    try {
      try {
        await set(ref(db, `users/${currentUser.uid}`), updatedProfile);
      } catch (dbErr) {
        console.warn("Profile update notice:", dbErr);
      }

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
        await set(ref(db, `users/${user.uid}`), {
          ...userProfile,
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

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGwSuccess('');
    setGwError('');

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSavingGw(true);

    const updatedGw: GatewayConfig = {
      enabled: gwEnabled,
      baseUrl: gwBaseUrl.trim(),
      apiKey: gwApiKey.trim(),
      authScheme: gwAuthScheme,
      model: gwModel.trim(),
      credentialKind: 'Static API key'
    };

    const updatedProfile: UserProfile = {
      ...userProfile,
      gatewayConfig: updatedGw
    };

    try {
      try {
        await set(ref(db, `users/${currentUser.uid}/gatewayConfig`), updatedGw);
      } catch (dbErr) {
        console.warn("RTDB Gateway update notice:", dbErr);
      }

      localStorage.setItem(`velora_gateway_config_${currentUser.uid}`, JSON.stringify(updatedGw));
      localStorage.setItem(`velora-profile-${currentUser.uid}`, JSON.stringify(updatedProfile));
      onUpdateProfile(updatedProfile);

      setGwSuccess('Gateway configuration saved successfully!');
      setTimeout(() => setGwSuccess(''), 3500);
    } catch (err: any) {
      console.error("Gateway save error:", err);
      setGwError('Failed to save Gateway settings.');
    } finally {
      setSavingGw(false);
    }
  };

  const handleTestGateway = async () => {
    setTestingGw(true);
    setTestStatus(null);
    try {
      const res = await fetch('/api/gateway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: gwBaseUrl,
          apiKey: gwApiKey,
          authScheme: gwAuthScheme,
          model: gwModel
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({ success: true, message: data.message });
      } else {
        setTestStatus({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: `Network error: ${err.message}` });
    } finally {
      setTestingGw(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-white border-b border-gray-100 shrink-0 z-10 relative">
        <div className="flex-1 flex justify-start items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors focus:ring-2 focus:ring-gray-200 outline-none flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back"
            title="Back to Chat"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
            <span>Back</span>
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-1.5 flex-1">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h1 className="text-base font-bold text-gray-900 tracking-wider uppercase">VELORA</h1>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
          <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 font-mono">
            @{userProfile.username}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6 bg-white">
        
        {/* User Card */}
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
            {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'V'}
          </div>

          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{userProfile.fullName || 'User'}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                <BadgeCheck className="w-3 h-3 text-indigo-600" />
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">@{userProfile.username}</p>
          </div>
        </div>

        {/* Account Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Edit Name Section */}
          <section className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm pb-2.5 border-b border-gray-100">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Change Name</span>
              </div>

              {nameSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{nameSuccess}</span>
                </div>
              )}

              {nameError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{nameError}</span>
                </div>
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
              <button
                type="submit"
                form="nameForm"
                disabled={savingName || fullName.trim() === userProfile.fullName}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Name
              </button>
            </div>
          </section>

          {/* Change Password Section */}
          <section className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm pb-2.5 border-b border-gray-100">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Change Password</span>
              </div>

              {passSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{passError}</span>
                </div>
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
              <button
                type="submit"
                form="passForm"
                disabled={updatingPass || !currentPassword || !newPassword}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Update Password
              </button>
            </div>
          </section>

          {/* Gateway Settings Section */}
          <section className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>External Gateway Configuration</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={gwEnabled}
                  onChange={(e) => setGwEnabled(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {gwSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{gwSuccess}</span>
              </div>
            )}

            {gwError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{gwError}</span>
              </div>
            )}

            <form id="gwForm" onSubmit={handleSaveGateway} className={`space-y-4 transition-opacity ${gwEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gateway Base URL</label>
                  <input
                    type="text"
                    value={gwBaseUrl}
                    onChange={(e) => setGwBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">API Model</label>
                  <input
                    type="text"
                    value={gwModel}
                    onChange={(e) => setGwModel(e.target.value)}
                    placeholder="gpt-3.5-turbo"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Auth Scheme</label>
                  <select
                    value={gwAuthScheme}
                    onChange={(e) => setGwAuthScheme(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                  >
                    <option value="x-api-key">x-api-key (Naga Style)</option>
                    <option value="Bearer">Bearer (OpenAI Style)</option>
                    <option value="x-goog-api-key">x-goog-api-key (Gemini Style)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={gwApiKey}
                      onChange={(e) => setGwApiKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {testStatus && (
                <div className={`p-2.5 rounded-xl text-[11px] font-medium border flex items-start gap-2 ${testStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                  {testStatus.success ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                  <div className="break-all">{testStatus.message}</div>
                </div>
              )}
            </form>

            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={handleTestGateway}
                disabled={testingGw || !gwBaseUrl || !gwEnabled}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {testingGw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                Test Connection
              </button>
              <button
                type="submit"
                form="gwForm"
                disabled={savingGw}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingGw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Gateway
              </button>
            </div>
          </section>

        </div>

        {/* VELORA Features Section */}
        <section className="bg-gray-50 rounded-2xl p-5 border border-gray-200/90 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">VELORA — Intelligent Capabilities</h3>
              <p className="text-[11px] text-gray-500">Fast, accurate, and reliable AI assistance for any task</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Instant Responses</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                VELORA delivers rapid, accurate answers to casual, analytical, or academic queries.
              </p>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Advanced Coding</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Write clean, properly formatted, fully functional code blocks with copy support.
              </p>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-xs text-gray-900">Secure & Encrypted</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Your profile credentials and chat history are safely stored with modern encryption.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            <span className="text-[11px] font-medium text-gray-600">VELORA AI Assistant — Version 1.0.0</span>
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </section>

      </main>
    </motion.div>
  );
}
