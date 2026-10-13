import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Copy, AlertCircle, Loader2, 
  Crown, Zap, ArrowRight, ShieldCheck, PhoneCall, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, onValue, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../lib/firebase';
import { cn, formatTokenCount } from '../lib/utils';
import { SP_VIP_PACKAGES, SP_TOKEN_PACKAGES, SpPaymentPackage } from '../lib/spPaymentConfig';
import { UserProfile } from '../types';

export interface BkashRequest {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  packageType: 'vip' | 'tokens';
  amount: number;
  priceBdt: number;
  priceSp: number;
  senderNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
}

interface BkashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userProfile?: UserProfile | null;
  initialTab?: 'vip' | 'tokens';
}

export default function BkashPaymentModal({
  isOpen,
  onClose,
  userId,
  userProfile,
  initialTab = 'vip'
}: BkashPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'tokens'>(initialTab);
  const [selectedPkg, setSelectedPkg] = useState<SpPaymentPackage>(
    initialTab === 'vip' ? SP_VIP_PACKAGES[1] : SP_TOKEN_PACKAGES[1]
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [viewHistory, setViewHistory] = useState(false);

  // Merchant bKash number from RTDB
  const [merchantNumber, setMerchantNumber] = useState<string | null>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = useState(true);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Step 2 Form
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User History
  const [userRequests, setUserRequests] = useState<BkashRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setSelectedPkg(initialTab === 'vip' ? SP_VIP_PACKAGES[1] : SP_TOKEN_PACKAGES[1]);
    }
  }, [initialTab, isOpen]);

  // Read merchant bKash number live from settings/bkash_number
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingMerchant(true);
    const numRef = ref(db, 'settings/bkash_number');
    const unsub = onValue(numRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setMerchantNumber(typeof val === 'string' ? val.trim() : (val ? String(val) : ''));
      } else {
        setMerchantNumber('');
      }
      setIsLoadingMerchant(false);
    }, (err) => {
      console.warn("bKash merchant number load error:", err);
      setIsLoadingMerchant(false);
    });

    return () => unsub();
  }, [isOpen]);

  // Read user's own bkash requests
  useEffect(() => {
    if (!isOpen || !userId) return;
    setIsLoadingHistory(true);
    const reqRef = query(ref(db, 'bkash_requests'), orderByChild('userId'), equalTo(userId));
    const unsub = onValue(reqRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: BkashRequest[] = Object.values(data);
        const userList = list
          .filter(r => r.userId === userId)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUserRequests(userList);
      } else {
        setUserRequests([]);
      }
      setIsLoadingHistory(false);
    }, (err) => {
      console.warn("User bkash requests error:", err);
      setIsLoadingHistory(false);
    });

    return () => unsub();
  }, [isOpen, userId]);

  const handleCopyNumber = () => {
    if (!merchantNumber) return;
    navigator.clipboard.writeText(merchantNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleTabChange = (tab: 'vip' | 'tokens') => {
    setActiveTab(tab);
    setSelectedPkg(tab === 'vip' ? SP_VIP_PACKAGES[1] : SP_TOKEN_PACKAGES[1]);
  };

  const handleProceedToForm = () => {
    setFormError(null);
    setStep(2);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSender = senderNumber.trim();
    const cleanTrx = trxId.trim().toUpperCase();

    // Bangladeshi mobile validation
    if (!/^01[3-9][0-9]{8}$/.test(cleanSender)) {
      setFormError("সঠিক বাংলাদেশি বিকাশ নম্বর দিন (যেমন: 017XXXXXXXX)");
      return;
    }

    // TrxID validation
    if (!cleanTrx || cleanTrx.length < 6) {
      setFormError("সঠিক বিকাশ TrxID দিন (কমপক্ষে ৬ অক্ষর)");
      return;
    }

    if (!userId) {
      setFormError("পেমেন্ট রিকোয়েস্ট পাঠানোর জন্য অনুগ্রহ করে লগইন করুন।");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bKash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const requestData: BkashRequest = {
        id: requestId,
        userId: userId,
        username: userProfile?.username || userProfile?.fullName || 'User',
        userEmail: userProfile?.email || `${userProfile?.username || 'user'}@nipa.app`,
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        packageType: selectedPkg.type,
        amount: selectedPkg.amount,
        priceBdt: selectedPkg.priceBdt,
        priceSp: selectedPkg.priceSp,
        senderNumber: cleanSender,
        trxId: cleanTrx,
        status: 'pending',
        createdAt: Date.now()
      };

      await set(ref(db, `bkash_requests/${requestId}`), requestData);

      // Notify ALL admins with title "নতুন পেমেন্ট রিকোয়েস্ট!"
      fetch('/api/bkash/notify-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userProfile?.username || userProfile?.fullName || 'User',
          packageName: selectedPkg.name,
          priceBdt: selectedPkg.priceBdt,
          trxId: cleanTrx
        })
      }).catch(err => console.warn('Admin push notification notify warning:', err));

      setStep(3);
    } catch (err: any) {
      console.error("bKash submission error:", err);
      setFormError(err?.message || "রিকোয়েস্ট সাবমিট করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setSenderNumber('');
    setTrxId('');
    setFormError(null);
    setViewHistory(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-pink-100 text-slate-900 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col relative my-auto"
        >
          {/* Header with bKash Brand Pink (#E2136E) */}
          <div className="p-4 sm:p-5 border-b border-pink-100 bg-gradient-to-r from-[#E2136E] via-[#C91060] to-[#990B47] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#E2136E] flex items-center justify-center font-black shadow-md shrink-0">
                <span className="text-xl">৳</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base leading-snug">বিকাশ পেমেন্ট (bKash)</h3>
                  <span className="text-[10px] font-black bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ম্যানুয়াল সেন্ড মানি
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-pink-100">
                  নিরাপদ ও সরাসরি বিকাশ পেমেন্টের মাধ্যমে VIP ও টোকেন নিন
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewHistory(!viewHistory)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewHistory ? "bg-white text-[#E2136E]" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title="আমার পেমেন্ট হিস্টোরি"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">হিস্টোরি</span>
                {userRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/30">
                    {userRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleResetAndClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User History View Toggle */}
          {viewHistory ? (
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E2136E]" />
                  <span>আপনার বিকাশ রিকোয়েস্টসমূহ</span>
                </h4>
                <button
                  onClick={() => setViewHistory(false)}
                  className="text-xs text-[#E2136E] font-bold hover:underline cursor-pointer"
                >
                  পেমেন্ট ফর্মে ফিরুন
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#E2136E]" />
                  <span className="text-xs font-medium">হিস্টোরি লোড হচ্ছে...</span>
                </div>
              ) : userRequests.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-150 p-6">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="text-sm font-bold text-slate-700">কোনো রিকোয়েস্ট পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400 mt-1">আপনি এখনো কোনো বিকাশ পেমেন্ট রিকোয়েস্ট পাঠাননি।</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-pink-200 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-slate-900">{req.packageName}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          req.status === 'approved' && "bg-emerald-100 text-emerald-800 border border-emerald-200",
                          req.status === 'pending' && "bg-amber-100 text-amber-800 border border-amber-200",
                          req.status === 'rejected' && "bg-rose-100 text-rose-800 border border-rose-200"
                        )}>
                          {req.status === 'approved' && "অনুমোদিত"}
                          {req.status === 'pending' && "পেন্ডিং"}
                          {req.status === 'rejected' && "বাতিল"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400">পরিমাণ:</span> <span className="font-bold text-slate-900 font-mono">৳{req.priceBdt} BDT</span>
                        </div>
                        <div>
                          <span className="text-slate-400">নম্বর:</span> <span className="font-mono">{req.senderNumber}</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <span><span className="text-slate-400">TrxID:</span> <span className="font-mono font-bold text-[#E2136E]">{req.trxId}</span></span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(req.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div className="col-span-2 text-rose-600 bg-rose-50 p-2 rounded-xl text-[11px] font-medium border border-rose-100">
                            বাতিলের কারণ: {req.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : step === 3 ? (
            /* Step 3: Success Screen */
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-pink-50 border-2 border-[#E2136E] rounded-full flex items-center justify-center mx-auto text-[#E2136E] shadow-[0_0_25px_rgba(226,19,110,0.25)]">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  রিকোয়েস্ট পাঠানো হয়েছে! 🎉
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-2 max-w-md mx-auto leading-relaxed">
                  অ্যাডমিন যাচাই করে ২৪ ঘণ্টার মধ্যে আপনার টোকেন/VIP যোগ করে দেবেন।
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">প্যাকেজ:</span>
                  <span className="font-black text-[#E2136E]">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">মূল্য:</span>
                  <span className="font-mono font-bold text-slate-900">৳{selectedPkg.priceBdt} BDT</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">বিকাশ প্রেরক নম্বর:</span>
                  <span className="font-mono font-bold text-slate-800">{senderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TrxID:</span>
                  <span className="font-mono font-black text-[#E2136E]">{trxId.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setViewHistory(true)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs transition-all cursor-pointer"
                >
                  স্ট্যাটাস দেখুন
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="flex-1 py-3 bg-gradient-to-r from-[#E2136E] to-[#C91060] text-white rounded-xl font-black text-xs hover:opacity-95 transition-all shadow-md cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: Form with Sender Number & TrxID */
            <form onSubmit={handleSubmitRequest} className="p-4 sm:p-6 space-y-5">
              {/* Selected Package Header summary */}
              <div className="bg-pink-50 border border-pink-200/70 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#E2136E] uppercase tracking-wider block">নির্বাচিত প্যাকেজ</span>
                  <h4 className="font-black text-slate-900 text-sm mt-0.5">{selectedPkg.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold block">পরিশোধযোগ্য</span>
                  <span className="font-black text-lg text-[#E2136E] font-mono">৳{selectedPkg.priceBdt}</span>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    আপনার বিকাশ নম্বর <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">যে বিকাশ নম্বর থেকে টাকা পাঠিয়েছেন</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    বিকাশ TrxID <span className="text-[#E2136E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="যেমন: BL72XK9Q"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-slate-900 focus:bg-white focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">বিকাশ এসএমএস বা অ্যাপের ৮-১০ ডিজিটের ট্রানজেকশন আইডি</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-colors cursor-pointer"
                >
                  পেছনে
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-[#E2136E] via-[#D11166] to-[#A80D52] hover:opacity-95 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>রিকোয়েস্ট পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>পেমেন্ট রিকোয়েস্ট নিশ্চিত করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 1: Package Summary + Live Merchant Number */
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Category Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTabChange('vip')}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                    activeTab === 'vip' 
                      ? "bg-white text-[#E2136E] shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Crown className="w-4 h-4" />
                  <span>👑 VIP মেম্বারশিপ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('tokens')}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                    activeTab === 'tokens' 
                      ? "bg-white text-[#E2136E] shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ টোকেন বান্ডেল</span>
                </button>
              </div>

              {/* Package Selector Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {(activeTab === 'vip' ? SP_VIP_PACKAGES : SP_TOKEN_PACKAGES).map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between text-left",
                        isSelected
                          ? "bg-pink-50/70 border-[#E2136E] ring-2 ring-[#E2136E]/30 shadow-sm"
                          : "bg-white border-slate-200 hover:border-pink-200 hover:bg-slate-50/50"
                      )}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2 -right-1 bg-gradient-to-r from-[#E2136E] to-pink-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-xs uppercase">
                          {pkg.badge}
                        </span>
                      )}

                      <div>
                        <h5 className="font-black text-xs text-slate-900 leading-snug line-clamp-1">
                          {pkg.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="font-black text-sm text-[#E2136E] font-mono">
                          ৳{pkg.priceBdt} BDT
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {pkg.type === 'vip' ? `${pkg.amount} দিন` : `+${formatTokenCount(pkg.amount)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Merchant bKash Number Box */}
              <div className="rounded-2xl border-2 border-dashed border-[#E2136E]/40 bg-pink-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E2136E] text-white flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block leading-tight">বিকাশ মার্চেন্ট / পার্সোনাল নম্বর:</span>
                      {isLoadingMerchant ? (
                        <div className="h-6 w-36 bg-pink-200/60 rounded animate-pulse mt-0.5" />
                      ) : merchantNumber ? (
                        <span className="text-base sm:text-lg font-black font-mono text-[#E2136E] tracking-wider">
                          {merchantNumber}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          শীঘ্রই আসছে (নম্বর সেট করা হয়নি)
                        </span>
                      )}
                    </div>
                  </div>

                  {merchantNumber && (
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                        copiedNumber 
                          ? "bg-emerald-600 text-white" 
                          : "bg-white text-[#E2136E] border border-pink-200 hover:bg-pink-100/50"
                      )}
                    >
                      {copiedNumber ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>কপি করুন</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-white/80 rounded-xl p-3 border border-pink-100 text-[11px] space-y-1 text-slate-700">
                  <p className="font-bold flex items-center gap-1.5 text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-[#E2136E]" />
                    <span>উপরের নম্বরে বিকাশে Send Money করুন:</span>
                    <span className="font-mono font-black text-[#E2136E] text-xs">৳{selectedPkg.priceBdt} BDT</span>
                  </p>
                  <p className="text-slate-500 pl-5">
                    টাকা পাঠানোর পর প্রাপ্ত <span className="font-bold text-slate-800">TrxID</span> এবং আপনার বিকাশ নম্বর দিয়ে নিচের বাটনে ক্লিক করে ফর্ম পূরণ করুন।
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                disabled={isLoadingMerchant || !merchantNumber}
                onClick={handleProceedToForm}
                className="w-full py-3.5 bg-gradient-to-r from-[#E2136E] via-[#D11166] to-[#A80D52] hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>পরবর্তী ধাপ (TrxID দিন)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
