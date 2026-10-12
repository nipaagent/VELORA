import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, User, UserCheck, Sparkles, Loader2, LogIn, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Gift } from 'lucide-react';

declare global {
  interface Window {
    grecaptcha?: any;
    onRecaptchaLoadCallback?: () => void;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  initialReferralCode?: string;
  initialIsSignUp?: boolean;
  onBackToLanding?: () => void;
}

export default function AuthModal({ isOpen, initialReferralCode, initialIsSignUp = false, onBackToLanding }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(!!initialReferralCode || initialIsSignUp);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(initialReferralCode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Initialize Real Google reCAPTCHA v2 for Sign Up
  useEffect(() => {
    if (!isOpen || !isSignUp) return;

    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted) return;
      if (window.grecaptcha && recaptchaContainerRef.current) {
        try {
          if (widgetIdRef.current === null) {
            recaptchaContainerRef.current.innerHTML = '';
            const wid = window.grecaptcha.render(recaptchaContainerRef.current, {
              sitekey: ((import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY as string) || "6Ld9n_NipaProdSiteKey2026_0199999999",
              callback: (token: string) => {
                if (isMounted) {
                  setRecaptchaToken(token);
                  setError('');
                }
              },
              'expired-callback': () => {
                if (isMounted) setRecaptchaToken(null);
              }
            });
            widgetIdRef.current = wid;
          }
        } catch (e) {
          console.warn("reCAPTCHA widget render notice:", e);
        }
      }
    };

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      renderWidget();
    } else {
      const existingScript = document.getElementById('google-recaptcha-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadCallback&render=explicit';
        script.async = true;
        script.defer = true;
        window.onRecaptchaLoadCallback = () => {
          renderWidget();
        };
        document.body.appendChild(script);
      } else {
        const checkTimer = setInterval(() => {
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            clearInterval(checkTimer);
            renderWidget();
          }
        }, 200);
        return () => clearInterval(checkTimer);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isSignUp]);

  if (!isOpen) return null;

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: '' };
    if (pass.length < 6) return { label: 'খুব দুর্বল (Weak)', color: 'text-red-500' };
    
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);
    
    if (
      (username && pass.toLowerCase().includes(username.toLowerCase())) ||
      (fullName && pass.toLowerCase().includes(fullName.toLowerCase().split(' ')[0]))
    ) {
      return { label: 'নামের সাথে মিল রয়েছে (Weak)', color: 'text-red-500' };
    }

    if (pass.length >= 8 && hasLetters && hasNumbers && hasSymbols) {
      return { label: 'শক্তিশালী (Hard)', color: 'text-emerald-500' };
    } else if (pass.length >= 6 && hasLetters && hasNumbers) {
      return { label: 'মাঝারি (Medium)', color: 'text-amber-500' };
    } else {
      return { label: 'দুর্বল (Weak)', color: 'text-rose-500' };
    }
  };

  const passStrength = isSignUp ? calculatePasswordStrength(password) : { label: '', color: '' };

  const handleOpenForgotPassword = () => {
    setResetIdentifier(username.trim());
    setResetError('');
    setResetSuccess('');
    setShowForgotPassword(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const rawInput = resetIdentifier.trim();
    if (!rawInput) {
      setResetError('সঠিক ইমেইল/ইউজারনেম দিন');
      return;
    }

    setResetLoading(true);

    try {
      let resolvedEmail = '';
      const isEmail = rawInput.includes('@');

      if (isEmail) {
        resolvedEmail = rawInput.toLowerCase();
      } else {
        const cleanUsername = rawInput.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanUsername) {
          setResetError('সঠিক ইমেইল/ইউজারনেম দিন');
          setResetLoading(false);
          return;
        }

        try {
          const usernameSnap = await get(ref(db, `usernames/${cleanUsername}`));
          if (usernameSnap.exists()) {
            const mappedUid = usernameSnap.val();
            const userSnap = await get(ref(db, `users/${mappedUid}`));
            if (userSnap.exists() && userSnap.val().email) {
              resolvedEmail = userSnap.val().email;
            }
          }
        } catch (dbErr) {
          console.warn("DB email lookup failed in password reset:", dbErr);
        }

        if (!resolvedEmail) {
          resolvedEmail = `${cleanUsername}@nipa.app`;
        }
      }

      await sendPasswordResetEmail(auth, resolvedEmail);
      setResetSuccess('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! আপনার ইমেইল ইনবক্স (এবং স্প্যাম ফোল্ডার) চেক করুন।');
    } catch (err: any) {
      console.error("Password reset error:", err);
      const code = err?.code || '';
      if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
        setResetError('সঠিক ইমেইল/ইউজারনেম দিন');
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setResetError('এই ইমেইল/ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি');
      } else if (code === 'auth/too-many-requests') {
        setResetError('অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন');
      } else {
        setResetError(err.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawInput = username.trim().toLowerCase();
    if (!rawInput) {
      setError('ইউজারনেম বা জিমেইল লিখুন।');
      return;
    }

    const isEmailInput = rawInput.includes('@');
    let cleanEmail = '';
    let cleanUsername = '';

    if (isEmailInput) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput)) {
        setError('অনুগ্রহ করে একটি সঠিক ইমেইল বা জিমেইল ঠিকানা দিন।');
        return;
      }
      cleanEmail = rawInput;
      const base = rawInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
      cleanUsername = base.length >= 3 ? base : `${base}_user`;
    } else {
      cleanUsername = rawInput.replace(/[^a-z0-9_]/g, '');
      if (!cleanUsername || cleanUsername.length < 3) {
        setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (ইংরেজি অক্ষর, সংখ্যা বা আন্ডারস্কোর)।');
        return;
      }
      cleanEmail = `${cleanUsername}@nipa.app`;
    }

    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      if (passStrength.label.includes("Weak") || passStrength.label.includes("দুর্বল") || passStrength.label.includes("মিল")) {
        setError("পাসওয়ার্ডটি খুব দুর্বল! শক্তিশালী পাসওয়ার্ড দিন।");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন (Full Name is required)।');
          setLoading(false);
          return;
        }

        if (!recaptchaToken) {
          setError('অনুগ্রহ করে নিচের reCAPTCHA ভেরিফিকেশনটি সম্পন্ন করুন।');
          setLoading(false);
          return;
        }

        // Server-side reCAPTCHA token verification
        try {
          const verifyRes = await fetch('/api/verify-recaptcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken })
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            setError(verifyData.error || 'reCAPTCHA ভেরিফিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
            if (window.grecaptcha && widgetIdRef.current !== null) {
              window.grecaptcha.reset(widgetIdRef.current);
              setRecaptchaToken(null);
            }
            setLoading(false);
            return;
          }
        } catch (vErr) {
          console.warn("reCAPTCHA validation call error:", vErr);
        }

        // Check if username exists before creating user
        if (!isEmailInput) {
          const usernameRef = await get(ref(db, `usernames/${cleanUsername}`));
          if (usernameRef.exists()) {
            setError("এই ইউজারনেমটি আগে থেকেই অন্য কেউ ব্যবহার করছে। নতুন ইউজারনেম দিন।");
            setLoading(false);
            return;
          }
        } else {
          // If signup via real email, adjust username if collision exists
          const usernameRef = await get(ref(db, `usernames/${cleanUsername}`));
          if (usernameRef.exists()) {
            cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
          }
        }

        // Create Firebase Auth User first
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
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

        // Save isolated user profile with email and uid
        const newUserProfile = {
          uid,
          email: cleanEmail,
          fullName: fullName.trim(),
          username: cleanUsername,
          createdAt: Date.now(),
          role: 'user',
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
        localStorage.setItem(`nipa-last-login-${uid}`, Date.now().toString());

        // Referrer rewards paused during security hardening — re-enable via a server-side claim queue.
      } else {
        // Sign In (Supports Email/Gmail directly or Username)
        let userCredential;
        let signinEmail = cleanEmail;

        // If it's a username input, try to get the real email from our DB first
        // to handle legacy accounts (@velora.app) vs new accounts (@nipa.app)
        if (!isEmailInput) {
          try {
            const usernameSnap = await get(ref(db, `usernames/${cleanUsername}`));
            if (usernameSnap.exists()) {
              const mappedUid = usernameSnap.val();
              const userSnap = await get(ref(db, `users/${mappedUid}`));
              if (userSnap.exists() && userSnap.val().email) {
                signinEmail = userSnap.val().email;
              }
            }
          } catch (e) {
            console.warn("DB email lookup failed, falling back to default suffix", e);
          }
        }

        try {
          userCredential = await signInWithEmailAndPassword(auth, signinEmail, cleanPassword);
        } catch (initialErr: any) {
          // If first attempt fails (maybe DB lookup was slow/empty), try common fallbacks
          if (!isEmailInput && (initialErr.code === 'auth/invalid-credential' || initialErr.code === 'auth/user-not-found')) {
            const fallbackEmails = [
              `${cleanUsername}@velora.app`,
              `${cleanUsername}@nipa.app`
            ].filter(e => e !== signinEmail);

            let success = false;
            for (const fe of fallbackEmails) {
              try {
                userCredential = await signInWithEmailAndPassword(auth, fe, cleanPassword);
                success = true;
                break;
              } catch {
                continue;
              }
            }
            if (!success) throw initialErr;
          } else {
            throw initialErr;
          }
        }

        const uid = userCredential.user.uid;
        
        // Save last login timestamp for force logout logic
        localStorage.setItem(`nipa-last-login-${uid}`, Date.now().toString());
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('এই ইউজারনেম বা জিমেইলটি আগে থেকেই ব্যবহৃত হচ্ছে। অনুগ্রহ করে লগইন করুন অথবা অন্য জিমেইল দিন।');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('ভুল ইউজারনেম/জিমেইল অথবা পাসওয়ার্ড।');
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
              NIPA Network v2.7
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">© 2026 NIPA SOLUTIONS</p>
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
            <h2 className="text-lg font-black tracking-widest text-slate-900 uppercase">NIPA</h2>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username or Gmail (ইউজারনেম বা জিমেইল)</label>
              <div className="relative group">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. alex_john or name@gmail.com"
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
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
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
              
              {isSignUp && password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                  <div className={`h-1.5 rounded-full flex-1 transition-all ${passStrength.color.replace("text-", "bg-")}`} />
                  <span className={`text-[10px] font-bold ${passStrength.color}`}>{passStrength.label}</span>
                </div>
              )}

              {!isSignUp && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/70 text-[11px] text-indigo-700 font-medium leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>প্রতিটি অ্যাকাউন্টের ডাটা ক্লাউডে ১০০% আলাদা ও সম্পূর্ণ নিজস্বভাবে সংরক্ষিত থাকে।</span>
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
                      placeholder="e.g. NIPA77"
                      readOnly={!!initialReferralCode}
                      className={`w-full pl-11 pr-4 py-3 text-sm rounded-2xl outline-none transition-all font-medium uppercase placeholder:text-slate-300 ${initialReferralCode ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed opacity-90' : 'bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50'}`}
                    />
                  </div>
                  <p className="text-[10px] text-indigo-600 ml-1 font-semibold">রেফার কোড থাকলে অ্যাকাউন্টে ৫০,০০০ বোনাস টোকেন যুক্ত হবে!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real Google reCAPTCHA v2 Widget Container */}
            {isSignUp && (
              <div className="py-2 flex flex-col items-center justify-center">
                <div 
                  ref={recaptchaContainerRef} 
                  className="overflow-hidden rounded-xl border border-slate-200/80 shadow-2xs min-h-[78px] flex items-center justify-center bg-slate-50/50 w-full max-w-[304px]" 
                />
                <span className="text-[10px] text-slate-400 mt-1.5 font-medium">Google reCAPTCHA বট প্রতিরোধ সিস্টেম</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-[0.1em] uppercase hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2.5 disabled:opacity-70"
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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold transition-colors uppercase tracking-wider cursor-pointer"
            >
              {isSignUp ? (
                <>Already a member? <span className="text-indigo-600">Sign In</span></>
              ) : (
                <>New to NIPA? <span className="text-indigo-600">Create Account</span></>
              )}
            </button>

            {/* Trust Badges - Fake badge removed */}
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                নিরাপদ লগইন
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                ক্লাউড সুরক্ষিত
              </span>
            </div>

            {onBackToLanding && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="text-xs text-slate-400 hover:text-slate-800 font-semibold transition-colors underline cursor-pointer"
                >
                  ← ল্যান্ডিং পেজে ফিরে যান (Back to Landing Page)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>

    {/* Real Password Reset Modal Dialog */}
    <AnimatePresence>
      {showForgotPassword && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">পাসওয়ার্ড পুনরুদ্ধার (Password Recovery)</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              আপনার নিবন্ধিত ইমেইল বা ইউজারনেম দিন। আমরা আপনার ইমেইলে পাসওয়ার্ড রিসেট করার একটি নিরাপদ লিংক পাঠাবো।
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Email or Username
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-indigo-600" />
                  <input
                    type="text"
                    value={resetIdentifier}
                    onChange={(e) => {
                      setResetIdentifier(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    placeholder="e.g. imran or user@gmail.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold leading-relaxed">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'রিসেট লিংক পাঠান'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
);
}
