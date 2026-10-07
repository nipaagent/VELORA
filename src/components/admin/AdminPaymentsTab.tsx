import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Clock, 
  ExternalLink, Search, RefreshCw, Sparkles, Filter, 
  ArrowUpRight, AlertCircle, Layers, DollarSign
} from 'lucide-react';
import { SP_GATEWAY_CONFIG, SP_VIP_PACKAGES, SP_TOKEN_PACKAGES } from '../../lib/spPaymentConfig';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';

export const AdminPaymentsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'tokens'>('all');

  const fetchTransactions = () => {
    setIsLoading(true);
    try {
      const txRef = ref(db, 'payment_transactions');
      onValue(txRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Object.values(val).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
          setTransactions(list);
        } else {
          setTransactions([]);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("RTDB transactions error:", err);
        setIsLoading(false);
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalRevenueBdt = transactions.reduce((acc, t) => acc + (t.priceBdt || 0), 0);
  const totalRevenueSp = transactions.reduce((acc, t) => acc + (t.priceSp || 0), 0);

  const filteredTransactions = transactions.filter(t => {
    const matchSearch = 
      (t.trxId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cardNumberMasked || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.packageName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Gateway Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-amber-500/30 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <CreditCard className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-amber-300 tracking-wider uppercase">
                  ACTIVE PAYMENT GATEWAY
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                SP WALLET BD - VIRTUAL CARD GATEWAY
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              ১ SP = ৳{SP_GATEWAY_CONFIG.exchangeRateBdtPerSp} BDT
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">App ID</span>
            <span className="font-mono font-bold text-amber-300 select-all block truncate">
              {SP_GATEWAY_CONFIG.appId}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Channel</span>
            <span className="font-bold text-emerald-400 select-all block truncate">
              {SP_GATEWAY_CONFIG.paymentChannel}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Settlement Wallet</span>
            <span className="font-mono font-bold text-indigo-300 select-all block truncate">
              {SP_GATEWAY_CONFIG.merchantSettlementWallet}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Checkout Endpoint</span>
            <span className="font-mono text-[11px] text-slate-300 truncate block">
              {SP_GATEWAY_CONFIG.cardCheckoutApi}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Statistics HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">মোট কার্ড ট্রানজেকশন</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
            <span>{transactions.length}</span>
            <span className="text-xs text-slate-400 font-bold">সফল</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">সর্বমোট পেমেন্ট (BDT)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-baseline gap-1">
            <span>৳{totalRevenueBdt.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-bold">BDT</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">SP Coins Equivalent</span>
          <div className="text-2xl font-black text-indigo-600 mt-1 flex items-baseline gap-1">
            <span>{totalRevenueSp.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-bold">SP</span>
          </div>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              ভার্চুয়াল কার্ড পেমেন্ট হিস্টোরি (Live Ledger)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              সকল ১৬-ডিজিট SP ভার্চুয়াল কার্ড ডেবিট ট্রানজেকশনের সম্পূর্ণ হিসাব।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="TXN ID, ইউজার, কার্ড..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">সব প্যাকেজ</option>
              <option value="vip">শুধুমাত্র VIP</option>
              <option value="tokens">শুধুমাত্র টোকেন</option>
            </select>

            <button
              onClick={fetchTransactions}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <th className="px-4 py-3">ট্রানজেকশন / সময়</th>
                <th className="px-4 py-3">ইউজার</th>
                <th className="px-4 py-3">প্যাকেজ</th>
                <th className="px-4 py-3">মূল্য (BDT / SP)</th>
                <th className="px-4 py-3">ভার্চুয়াল কার্ড</th>
                <th className="px-4 py-3 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id || tx.trxId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-indigo-600 select-all">{tx.trxId}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{tx.username || 'User'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{tx.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                      tx.type === 'vip' 
                        ? "bg-amber-100 text-amber-800 border border-amber-200" 
                        : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    )}>
                      {tx.packageName}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <div className="text-slate-900 font-black">৳{tx.priceBdt} BDT</div>
                    <div className="text-[10px] text-slate-500">{tx.priceSp} SP Coins</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                    {tx.cardNumberMasked || '•••• •••• •••• ••••'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 inline-flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      সফল (Active)
                    </span>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    কোনো পেমেন্ট ট্রানজেকশন পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
