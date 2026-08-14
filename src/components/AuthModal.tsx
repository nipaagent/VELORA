import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, UserCheck, Sparkles, Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Gift } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialReferralCode?: string;
}

export default function AuthModal({ isOpen, initialReferralCode }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(!!initialReferralCode);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(initialReferralCode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters using letters, numbers or underscores.');
      return;
    }

    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const email = `${cleanUsername}@velora.app`;

    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }

        // Create Firebase Auth User first (Firebase Auth will check if email/username is already in use)
        const userCredential = await createUserWithEmailAndPassword(auth, email, cleanPassword);
        const uid = userCredential.user.uid;

        // Referral logic
        let referrerUid = '';
        let referrerName = '';
        const cleanReferral = referralCodeInput.trim().toUpperCase();
        if (cleanReferral) {
          const usersRef = ref(db, 'users');
          const snapshot = await get(usersRef);
          if (snapshot.exists()) {
            const allUsers = snapshot.val();
            const referrer = Object.values(allUsers).find((u: any) => u.referralCode === cleanReferral) as any;
            if (referrer) {
              referrerUid = referrer.uid;
              referrerName = referrer.fullName || referrer.username;
            }
          }
        }

        // Generate unique referral code for new user (Pattern: I + 4 chars + M)
        let newReferralCode = '';
        const generateCode = () => {
          const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
          return `I${randomPart}M`;
        };

        // Ensure uniqueness (basic check)
        newReferralCode = generateCode();
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);
        if (usersSnap.exists()) {
          const allCodes = Object.values(usersSnap.val()).map((u: any) => u.referralCode);
          let attempts = 0;
          while (allCodes.includes(newReferralCode) && attempts < 10) {
            newReferralCode = generateCode();
            attempts++;
          }
        }

        // New user gets 100,000 tokens and 1-day VIP if referred
        const initialBonus = referrerUid ? 100000 : 0;
        const vipExpiresAt = referrerUid ? Date.now() + (24 * 60 * 60 * 1000) : undefined;

        // Now authenticated, save user profile
        const newUserProfile = {
          uid,
          fullName: fullName.trim(),
          username: cleanUsername,
          password: cleanPassword,
          createdAt: Date.now(),
          role: cleanUsername === 'admin' ? 'admin' : 'user',
          referralCode: newReferralCode,
          referredBy: referrerUid || undefined,
          referredByCode: referrerUid ? cleanReferral : undefined,
          referredByName: referrerName || undefined,
          isVip: referrerUid ? true : false,
          vipExpiresAt: vipExpiresAt,
          tokenState: {
            tokensUsedToday: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            bonusTokens: initialBonus
          }
        };

        await set(ref(db, `users/${uid}`), newUserProfile);
        await set(ref(db, `user_list/${uid}`), newUserProfile);
        await set(ref(db, `usernames/${cleanUsername}`), uid);

        // Save last login timestamp for force logout logic
        localStorage.setItem(`velora-last-login-${uid}`, Date.now().toString());

        // Award referrer 100,000 tokens and update referral count/milestones
        if (referrerUid) {
          const referrerRef = ref(db, `users/${referrerUid}`);
          const referrerSnap = await get(referrerRef);
          const referrerData = referrerSnap.val();
          
          if (referrerData) {
            const currentBonus = (referrerData.tokenState?.bonusTokens || 0);
            const newReferralCount = (referrerData.referralCount || 0) + 1;
            
            let extraVipDays = 0;
            if (newReferralCount === 10) extraVipDays = 3;
            else if (newReferralCount === 20) extraVipDays = 10;
            else if (newReferralCount === 30) extraVipDays = 20;

            const updates: any = {
              'tokenState/bonusTokens': currentBonus + 100000,
              'referralCount': newReferralCount
            };

            if (extraVipDays > 0) {
              const currentVipExpiry = referrerData.vipExpiresAt || 0;
              const baseTime = Math.max(currentVipExpiry, Date.now());
              updates['vipExpiresAt'] = baseTime + (extraVipDays * 24 * 60 * 60 * 1000);
              updates['isVip'] = true;
            }

            await update(referrerRef, updates);
          }
        }

      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, cleanPassword);
        const uid = userCredential.user.uid;
        
        // Save last login timestamp for force logout logic
        localStorage.setItem(`velora-last-login-${uid}`, Date.now().toString());
        
        // Update password in database upon login to ensure it's synced for admin visibility
        const updates: any = { password: cleanPassword };
        await update(ref(db, `users/${uid}`), updates);
        await update(ref(db, `user_list/${uid}`), updates);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This username is already registered.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid username or password.');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/50 backdrop-blur-sm overflow-y-auto selection:bg-indigo-100">
      {/* Minimal background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-50/40 blur-[100px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-50/30 blur-[80px] rounded-full translate-y-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] md:max-w-5xl md:h-[600px] bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-200/60 overflow-hidden relative z-10 flex flex-col md:flex-row"
      >
        {/* Left Side: Visual Branding (Desktop Only) */}
        <div className="hidden md:flex md:w-[45%] bg-slate-50 relative overflow-hidden flex-col justify-between p-12 border-r border-slate-100">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.1),transparent)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1),transparent)]"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight text-slate-900">
              Powerful Gateway <br /> 
              <span className="text-indigo-600">for Modern AI.</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[260px] font-medium">
              Experience the next generation of AI chat intelligence. Fast, secure, and always accessible.
            </p>
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white border border-slate-100 p-3 rounded-xl shadow-sm inline-flex">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Velora Network v2.7
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">© 2026 VELORA SOLUTIONS</p>
          </div>
        </div>

        {/* Right Side: Form Section */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="md:hidden px-8 pt-10 pb-2 text-center">
            <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-black tracking-widest text-slate-900 uppercase">VELORA</h2>
          </div>

          <div className="px-8 md:px-16 pt-8 md:pt-16 pb-12 flex-1 flex flex-col justify-center">
            <div className="mb-8 hidden md:block">
              <h1 className="text-2xl font-black text-slate-900">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                {isSignUp ? 'Get started with your account' : 'Sign in to access your AI chat dashboard'}
              </p>
            </div>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type="text"
                      required={isSignUp}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium placeholder:text-slate-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_john"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 text-sm bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                  <div className="relative group">
                    <Gift className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type="text"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      placeholder="e.g. VELORA77"
                      readOnly={!!initialReferralCode}
                      className={`w-full pl-11 pr-4 py-3 text-sm rounded-2xl outline-none transition-all font-medium uppercase placeholder:text-slate-300 ${initialReferralCode ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed opacity-90' : 'bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50'}`}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 ml-1 font-medium italic">Enter a code to get 1-day VIP access instantly!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-[0.1em] uppercase hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2.5 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In Now
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold transition-colors uppercase tracking-wider"
            >
              {isSignUp ? (
                <>Already a member? <span className="text-indigo-600">Sign In</span></>
              ) : (
                <>New to Velora? <span className="text-indigo-600">Create Account</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);
}
