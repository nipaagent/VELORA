import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Crown, Zap, CreditCard, ShieldCheck, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, ArrowRight, Lock, 
  Check, RefreshCw, Layers, ExternalLink, HelpCircle
} from 'lucide-react';
import { UserProfile, TokenState } from '../types';
import { 
  SP_GATEWAY_CONFIG, 
  SP_VIP_PACKAGES, 
  SP_TOKEN_PACKAGES, 
  SpPaymentPackage, 
  calcSpPrice 
} from '../lib/spPaymentConfig';
import { formatTokenCount, cn } from '../lib/utils';

interface SpCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userProfile?: UserProfile | null;
  initialTab?: 'vip' | 'tokens';
  onPaymentSuccess?: (result: {
    packageType: 'vip' | 'tokens';
    amount: number;
    trxId: string;
    message: string;
  }) => void;
}

export default function SpCardPaymentModal({
  isOpen,
  onClose,
  userId,
  userProfile,
  initialTab = 'vip',
  onPaymentSuccess
}: SpCardPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'tokens'>(initialTab);
  const [selectedPkg, setSelectedPkg] = useState<SpPaymentPackage>(
    initialTab === 'vip' ? SP_VIP_PACKAGES[1] : SP_TOKEN_PACKAGES[1]
  );
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(userProfile?.fullName || userProfile?.username || 'SP Card User');
  const [cardPin, setCardPin] = useState('');
  
  // Submission & Flow States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSelectTab = (tab: 'vip' | 'tokens') => {
    setActiveTab(tab);
    if (tab === 'vip') {
      setSelectedPkg(SP_VIP_PACKAGES[1]);
    } else {
      setSelectedPkg(SP_TOKEN_PACKAGES[1]);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s+/g, '');
    
    if (cleanCard.length !== 16) {
      setErrorMsg('দয়া করে ১৬ ডিজিটের সঠিক SP ভার্চুয়াল কার্ড নাম্বার লিখুন।');
      return;
    }

    if (!cardHolder.trim()) {
      setErrorMsg('দয়া করে কার্ড হোল্ডারের নাম লিখুন।');
      return;
    }

    if (!cardPin || cardPin.length < 2) {
      setErrorMsg('দয়া করে সঠিক ভার্চুয়াল কার্ড পিন লিখুন (২, ৩ বা ৪ ডিজিট)।');
      return;
    }

    if (!userId) {
      setErrorMsg('পেমেন্ট করতে পূর্বে লগইন অথবা একাউন্ট সেভ করুন।');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/payment/sp-card-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          packageId: selectedPkg.id,
          packageName: selectedPkg.name,
          packageType: selectedPkg.type,
          amount: selectedPkg.amount,
          priceBdt: selectedPkg.priceBdt,
          priceSp: selectedPkg.priceSp,
          cardNumber: cleanCard,
          cardHolder: cardHolder.trim(),
          cardPin: cardPin.trim()
        })
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = { error: 'সার্ভার থেকে সঠিক ফরম্যাটে রেসপন্স পাওয়া যায়নি।' };
      }

      if (!response.ok || !data?.success) {
        let errStr = 'পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে কার্ড তথ্য পরীক্ষা করুন।';
        if (typeof data?.error === 'string') {
          errStr = data.error;
        } else if (typeof data?.error === 'object' && data.error !== null) {
          errStr = data.error.message || data.error.error || JSON.stringify(data.error);
        } else if (typeof data?.message === 'string') {
          errStr = data.message;
        }
        throw new Error(errStr);
      }

      setSuccessData(data);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          packageType: selectedPkg.type,
          amount: selectedPkg.amount,
          trxId: data.trxId,
          message: data.message
        });
      }
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      const displayMsg = typeof err === 'string' 
        ? err 
        : (err?.message || 'পেমেন্ট সম্পূর্ণ করা সম্ভব হয়নি।');
      setErrorMsg(displayMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setCardNumber('');
    setCardPin('');
    setErrorMsg(null);
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
          className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col relative my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base leading-snug">SP WALLET BD</h3>
                  <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Virtual Card Only
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400">
                  ১ SP = ৳{SP_GATEWAY_CONFIG.exchangeRateBdtPerSp} BDT • ১৬-ডিজিট ভার্চুয়াল কার্ড ডেবিট
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Screen */}
          {successData ? (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  পেমেন্ট সফল হয়েছে! 🎉
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
                  আপনার SP ভার্চুয়াল কার্ড থেকে সফলভাবে ডেবিট করা হয়েছে এবং সুবিধা যুক্ত করা হয়েছে।
                </p>
              </div>

              {/* Invoice Summary */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">প্যাকেজ:</span>
                  <span className="font-black text-amber-300">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">পরিশোধিত মূল্য:</span>
                  <span className="font-mono font-bold text-white">
                    ৳{successData.priceBdt} BDT ({successData.priceSp} SP)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">ভার্চুয়াল কার্ড:</span>
                  <span className="font-mono font-bold text-slate-300">{successData.cardNumberMasked}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">ট্রানজেকশন আইডি:</span>
                  <span className="font-mono font-bold text-indigo-400">{successData.trxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">স্ট্যাটাস:</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> সক্রিয় (ACTIVE)
                  </span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg cursor-pointer"
              >
                ঠিক আছে (Done)
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Type Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelectTab('vip')}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                    activeTab === 'vip' 
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Crown className="w-4 h-4" />
                  <span>👑 VIP মেম্বারশিপ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('tokens')}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                    activeTab === 'tokens' 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ টোকেন প্যাক</span>
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
                          ? "bg-slate-850 border-amber-400 ring-2 ring-amber-400/40 shadow-lg"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                      )}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-xs uppercase">
                          {pkg.badge}
                        </span>
                      )}

                      <div>
                        <h5 className="font-black text-xs text-white leading-snug line-clamp-1">
                          {pkg.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <span className="font-black text-sm text-amber-300">
                          ৳{pkg.priceBdt}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {pkg.priceSp} SP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Realistic Interactive Virtual Card Live Preview */}
              <div className="relative rounded-2xl p-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-700/80 shadow-2xl overflow-hidden group">
                {/* Hologram / Ambient glow */}
                <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-6 bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 rounded-md shadow-xs border border-amber-200/40 relative overflow-hidden">
                      <div className="absolute inset-0 border-t border-b border-amber-900/30 top-2 bottom-2" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 tracking-widest pl-1">DEBIT</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[11px] tracking-wider text-amber-400">SP WALLET BD</span>
                  </div>
                </div>

                {/* 16-Digit Card Display */}
                <div className="relative z-10 my-3">
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Virtual Card Number (16-Digit)
                  </div>
                  <div className="font-mono text-base sm:text-lg font-black tracking-widest text-slate-100 flex items-center gap-2">
                    {cardNumber ? (
                      <span>{cardNumber.padEnd(19, '•')}</span>
                    ) : (
                      <span className="text-slate-600">•••• •••• •••• ••••</span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase tracking-wider">Cardholder</span>
                    <span className="font-bold text-slate-200 truncate block max-w-[180px]">
                      {cardHolder || 'SP CARD USER'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[8px] uppercase tracking-wider">Channel</span>
                    <span className="font-mono font-bold text-emerald-400">16-DIGIT VIRTUAL</span>
                  </div>
                </div>
              </div>

              {/* Payment Input Form */}
              <form onSubmit={handlePay} className="space-y-3.5">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs font-bold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-300 flex items-center justify-between">
                    <span>১৬-ডিজিট SP ভার্চুয়াল কার্ড নাম্বার:</span>
                    <span className="text-[10px] text-amber-400 font-mono">16 DIGITS</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-black tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      কার্ড হোল্ডারের নাম:
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Cardholder Full Name"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>কার্ড পিন (PIN):</span>
                      <span className="text-[10px] text-amber-400 font-mono">২, ৩ বা ৪ ডিজিট</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={cardPin}
                        onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="PIN (২, ৩ বা ৪ ডিজিট)"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-widest"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    SP Wallet ডেবিট গেটওয়ের মাধ্যমে সাথে সাথেই একাউন্টে যুক্ত হবে।
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>কার্ড ভেরিফাই ও প্রসেসিং হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-slate-950" />
                      <span>
                        ৳{selectedPkg.priceBdt} BDT ({selectedPkg.priceSp} SP) পরিশোধ করুন
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer Note */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
            Powered by SP Wallet BD Virtual Card Gateway (16-Digit Channel)
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
