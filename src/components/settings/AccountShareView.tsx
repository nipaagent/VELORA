import React, { useState, useEffect } from 'react';
import { 
  Link, Copy, Check, Trash2, Clock, 
  ExternalLink, MessageCircle, Users, RefreshCw, Loader2, Sparkles
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface AccountShareViewProps {
  userProfile: UserProfile | null;
  onSuccessSwitch?: (sharedAccountName: string) => void;
}

interface SharedLinkData {
  code: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: number;
  expiresAt: number; // 0 = unlimited
  maxUsers: number; // 0 = unlimited
  useCount?: number;
  accessPass: string;
  isActive: boolean;
}

type TimeUnit = 'm' | 'h' | 'd';

export default function AccountShareView({ userProfile }: AccountShareViewProps) {
  // Time state
  const [selectedMinutes, setSelectedMinutes] = useState<number>(1440); // 24h
  const [customTimeVal, setCustomTimeVal] = useState<number>(2);
  const [customTimeType, setCustomTimeType] = useState<TimeUnit>('h');
  const [isCustomTime, setIsCustomTime] = useState(false);

  // User limit state
  const [selectedUsers, setSelectedUsers] = useState<number>(1);
  const [customUserVal, setCustomUserVal] = useState<number>(3);
  const [isCustomUsers, setIsCustomUsers] = useState(false);

  // Operation state
  const [isCreating, setIsCreating] = useState(false);
  const [myLinks, setMyLinks] = useState<SharedLinkData[]>([]);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);
  const [latestCode, setLatestCode] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = auth.currentUser;

  const getShareUrl = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?share=${code}`;
  };

  // Calculate Duration Ms
  const getDurationMs = (): number => {
    if (isCustomTime) {
      const v = Math.max(1, customTimeVal || 1);
      if (customTimeType === 'm') return v * 60 * 1000;
      if (customTimeType === 'h') return v * 60 * 60 * 1000;
      return v * 24 * 60 * 60 * 1000;
    }
    if (selectedMinutes === 0) return 0; // unlimited
    return selectedMinutes * 60 * 1000;
  };

  // Calculate Max Users
  const getMaxUsersCount = (): number => {
    if (isCustomUsers) {
      return Math.max(1, customUserVal || 1);
    }
    return selectedUsers;
  };

  const formatRemaining = (expiresAt: number) => {
    if (expiresAt === 0) return 'আজীবন';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const m = Math.floor(diff / (60 * 1000));
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} দিন ${h % 24} ঘণ্টা`;
    if (h > 0) return `${h} ঘণ্টা ${m % 60} মি.`;
    return `${m} মিনিট`;
  };

  const loadLinks = async () => {
    if (!currentUser) return;
    try {
      const snap = await get(ref(db, `user_share_codes/${currentUser.uid}`));
      if (snap.exists()) {
        const list: SharedLinkData[] = Object.values(snap.val());
        const sorted = list.sort((a, b) => b.createdAt - a.createdAt);
        setMyLinks(sorted);
        if (sorted.length > 0 && !latestUrl) {
          setLatestUrl(getShareUrl(sorted[0].code));
          setLatestCode(sorted[0].code);
        }
      } else {
        setMyLinks([]);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [currentUser]);

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setIsCreating(true);
    setErrorMsg('');

    try {
      const userSnap = await get(ref(db, `users/${currentUser.uid}`));
      const pass = userSnap.val()?.password || userProfile.password;
      if (!pass) {
        throw new Error("পাসওয়ার্ড পাওয়া যায়নি। Account Details চেক করুন।");
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'NIPA-';
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

      const now = Date.now();
      const ms = getDurationMs();
      const expiresAt = ms === 0 ? 0 : now + ms;
      const maxUsers = getMaxUsersCount();

      const linkData: SharedLinkData = {
        code,
        ownerUid: currentUser.uid,
        ownerName: userProfile.fullName || userProfile.username || 'User',
        ownerEmail: currentUser.email || `${userProfile.username}@nipa.app`,
        createdAt: now,
        expiresAt,
        maxUsers,
        useCount: 0,
        accessPass: pass,
        isActive: true
      };

      await set(ref(db, `public_share_codes/${code}`), linkData);
      await set(ref(db, `user_share_codes/${currentUser.uid}/${code}`), linkData);

      const url = getShareUrl(code);
      setLatestUrl(url);
      setLatestCode(code);
      await loadLinks();
    } catch (err: any) {
      setErrorMsg(err.message || "ত্রুটি হয়েছে।");
    } finally {
      setIsCreating(false);
    }
  };

  const revokeLink = async (code: string) => {
    if (!currentUser || !window.confirm("লিংকটি ডিলিট করতে চান?")) return;
    try {
      await remove(ref(db, `public_share_codes/${code}`));
      await remove(ref(db, `user_share_codes/${currentUser.uid}/${code}`));
      if (latestCode === code) {
        setLatestUrl(null);
        setLatestCode(null);
      }
      await loadLinks();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Compact preset lists
  const timePresets = [
    { label: '১০ মি.', val: 10 },
    { label: '১ ঘণ্টা', val: 60 },
    { label: '২৪ ঘণ্টা', val: 1440 },
    { label: '৭ দিন', val: 1440 * 7 },
    { label: 'আজীবন', val: 0 },
  ];

  const userPresets = [
    { label: '১ জন', val: 1 },
    { label: '২ জন', val: 2 },
    { label: '৫ জন', val: 5 },
    { label: '১০ জন', val: 10 },
    { label: 'সীমাহীন', val: 0 },
  ];

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Link className="w-4 h-4 text-indigo-600" />
          Account Share
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {currentUser?.email || userProfile?.username}
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Generated Share Link Card */}
      {latestUrl && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>আপনার শেয়ার লিংক</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 rounded-xl p-1.5 pr-2 border border-slate-700">
            <input
              type="text"
              readOnly
              value={latestUrl}
              className="flex-1 bg-transparent border-0 text-xs font-mono font-bold text-white px-2 focus:outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={() => copyLink(latestUrl, 'top')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedId === 'top' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'top' ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(latestUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <a
              href={latestUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              টেস্ট করুন
            </a>
          </div>
        </div>
      )}

      {/* Compact Config Form */}
      <form onSubmit={createShareLink} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-4">
        {/* 1. Time Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              সময়কাল (Duration)
            </label>
            <button
              type="button"
              onClick={() => setIsCustomTime(!isCustomTime)}
              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              {isCustomTime ? 'প্রিসেট' : 'কাস্টম'}
            </button>
          </div>

          {!isCustomTime ? (
            <div className="grid grid-cols-5 gap-1.5">
              {timePresets.map((p) => {
                const active = selectedMinutes === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setSelectedMinutes(p.val)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-bold border transition-colors text-center cursor-pointer",
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customTimeVal}
                onChange={(e) => setCustomTimeVal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center"
              />
              <select
                value={customTimeType}
                onChange={(e) => setCustomTimeType(e.target.value as TimeUnit)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="m">মিনিট (Minutes)</option>
                <option value="h">ঘণ্টা (Hours)</option>
                <option value="d">দিন (Days)</option>
              </select>
            </div>
          )}
        </div>

        {/* 2. User Limit Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              ইউজার সীমা (User Limit)
            </label>
            <button
              type="button"
              onClick={() => setIsCustomUsers(!isCustomUsers)}
              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              {isCustomUsers ? 'প্রিসেট' : 'কাস্টম'}
            </button>
          </div>

          {!isCustomUsers ? (
            <div className="grid grid-cols-5 gap-1.5">
              {userPresets.map((u) => {
                const active = selectedUsers === u.val;
                return (
                  <button
                    key={u.val}
                    type="button"
                    onClick={() => setSelectedUsers(u.val)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-bold border transition-colors text-center cursor-pointer",
                      active
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customUserVal}
                onChange={(e) => setCustomUserVal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center"
              />
              <span className="text-xs font-bold text-slate-600">জন ইউজার</span>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
          <span>লিংক তৈরি করুন</span>
        </button>
      </form>

      {/* Active Links Table */}
      {myLinks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>সক্রিয় লিংক ({myLinks.length})</span>
            <button onClick={loadLinks} className="p-1 hover:bg-slate-200 rounded cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {myLinks.map((sl) => {
              const url = getShareUrl(sl.code);
              const isExpired = sl.expiresAt > 0 && sl.expiresAt < Date.now();
              const isFull = sl.maxUsers > 0 && (sl.useCount || 0) >= sl.maxUsers;
              const remaining = formatRemaining(sl.expiresAt);
              const userStat = sl.maxUsers === 0 ? 'আনলিমিটেড' : `${sl.useCount || 0}/${sl.maxUsers} জন`;

              return (
                <div key={sl.code} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-600 truncate max-w-[180px] sm:max-w-xs">
                        {url}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">Expired</span>
                      ) : isFull ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Full</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>সময়: {remaining}</span>
                      <span>·</span>
                      <span>ইউজার: {userStat}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyLink(url, sl.code)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title="কপি"
                    >
                      {copiedId === sl.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeLink(sl.code)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="ডিলিট"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
