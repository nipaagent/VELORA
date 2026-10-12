import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Clock, 
  ExternalLink, Search, RefreshCw, Sparkles, Filter, 
  AlertCircle, Layers, DollarSign, PhoneCall, Save, 
  Check, X as XIcon, Copy, Loader2
} from 'lucide-react';
import { SP_GATEWAY_CONFIG } from '../../lib/spPaymentConfig';
import { cn } from '../../lib/utils';
import { db, auth } from '../../lib/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';
import { BkashRequest } from '../BkashPaymentModal';

export const AdminPaymentsTab: React.FC = () => {
  // bKash Merchant Number Settings state
  const [bkashNumberInput, setBkashNumberInput] = useState('');
  const [isSavingBkashNumber, setIsSavingBkashNumber] = useState(false);
  const [saveNumberSuccess, setSaveNumberSuccess] = useState(false);
  const [saveNumberError, setSaveNumberError] = useState<string | null>(null);

  // bKash Requests state
  const [bkashRequests, setBkashRequests] = useState<BkashRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [requestSearch, setRequestSearch] = useState('');
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  // Processing actions (Approve / Reject)
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<BkashRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Legacy Card Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activePaymentSubTab, setActivePaymentSubTab] = useState<'bkash' | 'card_ledger'>('bkash');

  // Load merchant bKash number
  useEffect(() => {
    const numRef = ref(db, 'settings/bkash_number');
    const unsub = onValue(numRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setBkashNumberInput(typeof val === 'string' ? val : (val ? String(val) : ''));
      }
    }, (err) => {
      console.warn("bKash merchant number load error:", err);
    });
    return () => unsub();
  }, []);

  // Load all bkash_requests
  useEffect(() => {
    setIsLoadingRequests(true);
    const reqRef = ref(db, 'bkash_requests');
    const unsub = onValue(reqRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: BkashRequest[] = Object.values(data);
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBkashRequests(list);
      } else {
        setBkashRequests([]);
      }
      setIsLoadingRequests(false);
    }, (err) => {
      console.warn("bKash requests load error:", err);
      setIsLoadingRequests(false);
    });

    return () => unsub();
  }, []);

  // Load card transactions
  useEffect(() => {
    const txRef = ref(db, 'payment_transactions');
    const unsub = onValue(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.values(val).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        setTransactions(list);
      } else {
        setTransactions([]);
      }
    }, (err) => {
      console.warn("Payment transactions load error:", err);
      setTransactions([]);
    });
    return () => unsub();
  }, []);

  // Save merchant bKash number
  const handleSaveBkashNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNumberError(null);
    setSaveNumberSuccess(false);

    const cleanNum = bkashNumberInput.trim();
    if (cleanNum && !/^01[3-9][0-9]{8}$/.test(cleanNum)) {
      setSaveNumberError("সঠিক বিকাশ নম্বর দিন (যেমন: 01XXXXXXXXX)");
      return;
    }

    setIsSavingBkashNumber(true);
    try {
      await set(ref(db, 'settings/bkash_number'), cleanNum);
      setSaveNumberSuccess(true);
      setTimeout(() => setSaveNumberSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save bKash number error:", err);
      setSaveNumberError(err?.message || "নম্বর সংরক্ষণ করা যায়নি।");
    } finally {
      setIsSavingBkashNumber(false);
    }
  };

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrxId(trx);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  // Approve bKash Request & Credit User
  const handleApprove = async (reqItem: BkashRequest) => {
    const confirmApprove = window.confirm(
      `অনুমোদন করবেন?\n\nইউজার: ${reqItem.username}\nপ্যাকেজ: ${reqItem.packageName}\nমূল্য: ৳${reqItem.priceBdt}\nTrxID: ${reqItem.trxId}`
    );
    if (!confirmApprove) return;

    setProcessingId(reqItem.id);
    try {
      const now = Date.now();
      const adminUid = auth.currentUser?.uid || 'admin';

      // 1. Read existing user document
      const userSnap = await get(ref(db, `users/${reqItem.userId}`));
      const userDoc = userSnap.exists() ? userSnap.val() : {};

      const updates: Record<string, any> = {};

      // 2. Credit based on packageType
      if (reqItem.packageType === 'vip') {
        const vipDays = Number(reqItem.amount) || 30;
        const isLifetime = vipDays >= 36500;
        let newVipExp: number;
        if (isLifetime) {
          newVipExp = 2000000000000;
        } else {
          const currentExp = userDoc.vipExpiresAt || 0;
          const baseTime = currentExp > now ? currentExp : now;
          newVipExp = baseTime + (vipDays * 24 * 60 * 60 * 1000);
        }
        updates[`users/${reqItem.userId}/isVip`] = true;
        updates[`users/${reqItem.userId}/vipExpiresAt`] = newVipExp;
      } else if (reqItem.packageType === 'tokens') {
        const addedTokens = Number(reqItem.amount) || 100000;
        const currentBonus = userDoc.tokenState?.bonusTokens || 0;
        const newBonus = currentBonus + addedTokens;
        updates[`users/${reqItem.userId}/tokenState/bonusTokens`] = newBonus;
      }

      // 3. Mark request approved
      updates[`bkash_requests/${reqItem.id}/status`] = 'approved';
      updates[`bkash_requests/${reqItem.id}/processedAt`] = now;
      updates[`bkash_requests/${reqItem.id}/processedBy`] = adminUid;

      // 4. Record in payment_transactions & users/{userId}/transactions
      const transactionRecord = {
        id: reqItem.trxId,
        trxId: reqItem.trxId,
        orderId: `BKASH_${reqItem.id.slice(0, 8)}`,
        userId: reqItem.userId,
        username: reqItem.username,
        userEmail: reqItem.userEmail,
        packageId: reqItem.packageId,
        packageName: reqItem.packageName,
        type: reqItem.packageType,
        amount: Number(reqItem.amount),
        priceBdt: Number(reqItem.priceBdt),
        priceSp: Number(reqItem.priceSp || 0),
        senderNumber: reqItem.senderNumber,
        status: 'completed',
        gateway: 'bKash Manual Send Money',
        timestamp: now
      };

      updates[`payment_transactions/${reqItem.trxId}`] = transactionRecord;
      updates[`users/${reqItem.userId}/transactions/${reqItem.trxId}`] = transactionRecord;

      await update(ref(db), updates);
      alert(`সফলভাবে রিকোয়েস্ট অনুমোদিত হয়েছে এবং ইউজারের একাউন্টে ক্রেডিট যোগ করা হয়েছে!`);
    } catch (err: any) {
      console.error("Approve error:", err);
      alert("অনুমোদনে ত্রুটি হয়েছে: " + (err?.message || "অজানা ত্রুটি"));
    } finally {
      setProcessingId(null);
    }
  };

  // Reject bKash Request
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setProcessingId(rejectingRequest.id);

    try {
      const now = Date.now();
      const adminUid = auth.currentUser?.uid || 'admin';
      const reason = rejectionReasonInput.trim() || 'পেমেন্ট ট্রানজেকশন যাচাই ব্যর্থ হয়েছে।';

      const updates: Record<string, any> = {
        [`bkash_requests/${rejectingRequest.id}/status`]: 'rejected',
        [`bkash_requests/${rejectingRequest.id}/rejectionReason`]: reason,
        [`bkash_requests/${rejectingRequest.id}/processedAt`]: now,
        [`bkash_requests/${rejectingRequest.id}/processedBy`]: adminUid
      };

      await update(ref(db), updates);
      setRejectingRequest(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      console.error("Reject error:", err);
      alert("বাতিল করতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter bKash requests
  const filteredBkashRequests = bkashRequests.filter((r) => {
    const matchFilter = requestFilter === 'all' || r.status === requestFilter;
    const matchSearch = 
      (r.username || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.trxId || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.senderNumber || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.packageName || '').toLowerCase().includes(requestSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = bkashRequests.filter(r => r.status === 'pending').length;
  const approvedCount = bkashRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = bkashRequests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* 1. bKash Merchant Number Settings Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#E2136E] border border-pink-200/60 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>বিকাশ মার্চেন্ট নম্বর সেটিংস</span>
              <span className="text-[10px] font-black bg-pink-100 text-[#E2136E] px-2 py-0.5 rounded-full uppercase">
                লাইভ সেটিংস
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              এখানে যে বিকাশ নম্বরটি দেবেন, ইউজাররা পেমেন্ট করার সময় সরাসরি সেটি দেখতে পাবেন এবং সেন্ড মানি করবেন।
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBkashNumber} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={bkashNumberInput}
              onChange={(e) => setBkashNumberInput(e.target.value)}
              placeholder="যেমন: 01712345678"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingBkashNumber}
            className="px-6 py-2.5 bg-[#E2136E] hover:bg-[#C91060] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavingBkashNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>নম্বর সংরক্ষণ করুন</span>
          </button>
        </form>

        {saveNumberSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>বিকাশ নম্বর সফলভাবে আপডেট হয়েছে!</span>
          </div>
        )}
        {saveNumberError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveNumberError}</span>
          </div>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActivePaymentSubTab('bkash')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer",
            activePaymentSubTab === 'bkash'
              ? "bg-[#E2136E] text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          )}
        >
          <span>বিকাশ রিকোয়েস্ট</span>
          {pendingCount > 0 && (
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
              activePaymentSubTab === 'bkash' ? "bg-white/30 text-white" : "bg-rose-100 text-rose-700"
            )}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActivePaymentSubTab('card_ledger')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer",
            activePaymentSubTab === 'card_ledger'
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
          )}
        >
          <span>ভার্চুয়াল কার্ড লেজার</span>
          <span className="text-[10px] text-slate-400 font-mono">({transactions.length})</span>
        </button>
      </div>

      {activePaymentSubTab === 'bkash' ? (
        /* 2. bKash Requests Table */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Header and Filters */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>বিকাশ পেমেন্ট রিকোয়েস্টসমূহ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ইউজারদের পাঠানো ম্যানুয়াল বিকাশ পেমেন্টের TrxID যাচাই করে অনুমোদন অথবা বাতিল করুন।
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRequestFilter('pending')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    requestFilter === 'pending' ? "bg-white text-amber-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>পেন্ডিং</span>
                  <span className="font-mono text-[10px]">({pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('approved')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    requestFilter === 'approved' ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>অনুমোদিত</span>
                  <span className="font-mono text-[10px]">({approvedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('rejected')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    requestFilter === 'rejected' ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>বাতিল</span>
                  <span className="font-mono text-[10px]">({rejectedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    requestFilter === 'all' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  সব ({bkashRequests.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  placeholder="ইউজার, TrxID, নম্বর..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                  <th className="px-4 py-3">ইউজার</th>
                  <th className="px-4 py-3">প্যাকেজ</th>
                  <th className="px-4 py-3">পরিমাণ (৳)</th>
                  <th className="px-4 py-3">প্রেরক নম্বর</th>
                  <th className="px-4 py-3">TrxID</th>
                  <th className="px-4 py-3">সময়</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBkashRequests.map((r) => {
                  const isProcessing = processingId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{r.username}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.userEmail}</div>
                      </td>

                      {/* Package */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          r.packageType === 'vip' 
                            ? "bg-amber-100 text-amber-800 border border-amber-200" 
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        )}>
                          {r.packageName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                        ৳{r.priceBdt}
                      </td>

                      {/* Sender Number */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {r.senderNumber}
                      </td>

                      {/* TrxID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono font-black text-[#E2136E]">
                          <span>{r.trxId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(r.trxId)}
                            className="p-1 hover:bg-pink-50 rounded text-slate-400 hover:text-[#E2136E] transition-colors cursor-pointer"
                            title="কপি TrxID"
                          >
                            {copiedTrxId === r.trxId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(r.createdAt).toLocaleString('bn-BD')}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                          r.status === 'approved' && "bg-emerald-100 text-emerald-800 border border-emerald-200",
                          r.status === 'pending' && "bg-amber-100 text-amber-800 border border-amber-200",
                          r.status === 'rejected' && "bg-rose-100 text-rose-800 border border-rose-200"
                        )}>
                          {r.status === 'approved' && "অনুমোদিত"}
                          {r.status === 'pending' && "পেন্ডিং"}
                          {r.status === 'rejected' && "বাতিল"}
                        </span>
                        {r.status === 'rejected' && r.rejectionReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={r.rejectionReason}>
                            কারণ: {r.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(r)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>অনুমোদন</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingRequest(r);
                                setRejectionReasonInput('');
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <XIcon className="w-3 h-3" />
                              <span>বাতিল</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">প্রসেসড</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredBkashRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      কোনো বিকাশ পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Legacy Card Ledger view */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                ভার্চুয়াল কার্ড পেমেন্ট হিস্টোরি (Legacy Ledger)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                পূর্বের সম্পন্ন হওয়া কার্ড ট্রানজেকশনের সম্পূর্ণ তালিকা।
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                  <th className="px-4 py-3">ট্রানজেকশন</th>
                  <th className="px-4 py-3">ইউজার</th>
                  <th className="px-4 py-3">প্যাকেজ</th>
                  <th className="px-4 py-3">মূল্য</th>
                  <th className="px-4 py-3">কার্ড নম্বর</th>
                  <th className="px-4 py-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.trxId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{tx.trxId}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{tx.username || 'User'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{tx.packageName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">৳{tx.priceBdt} BDT</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{tx.cardNumberMasked || '••••'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">সফল</span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      কোনো কার্ড ট্রানজেকশন নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>রিকোয়েস্ট বাতিল করুন</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              ইউজার: <span className="font-bold text-slate-800">{rejectingRequest.username}</span> | TrxID: <span className="font-mono font-bold text-slate-800">{rejectingRequest.trxId}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বাতিলের কারণ (ঐচ্ছিক):</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="যেমন: TrxID টি পাওয়া যায়নি বা টাকার পরিমাণ ভুল..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                নিশ্চিত বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
