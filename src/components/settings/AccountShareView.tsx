import React, { useState, useEffect } from 'react';
import { 
  Share2, Link, Copy, CheckCircle2, AlertCircle, 
  Loader2, Trash2, ShieldCheck, RefreshCw, Clock, 
  ExternalLink, Send, Check, Sparkles, MessageCircle, Globe,
  Lock, Eye
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { ref, get, set, remove } from 'firebase/database';
import { UserProfile } from '../../types';
import UserAvatar from '../UserAvatar';
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
  expiresAt: number; // timestamp, 0 = never
  accessPass: string;
  isActive: boolean;
  sharedNote?: string;
  useCount?: number;
}

export default function AccountShareView({ userProfile }: AccountShareViewProps) {
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [shareNote, setShareNote] = useState<string>('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [mySharedLinks, setMySharedLinks] = useState<SharedLinkData[]>([]);
  const [latestShareUrl, setLatestShareUrl] = useState<string | null>(null);
  const [latestCode, setLatestCode] = useState<string | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentUser = auth.currentUser;

  // Helper to construct full URL from share code
  const getShareUrl = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?share=${code}`;
  };

  // Load all active shared links created by this user from Firebase
  const loadMySharedLinks = async () => {
    if (!currentUser) return;
    try {
      const snap = await get(ref(db, `user_share_codes/${currentUser.uid}`));
      if (snap.exists()) {
        const val = snap.val();
        const list: SharedLinkData[] = Object.values(val);
        const sorted = list.sort((a, b) => b.createdAt - a.createdAt);
        setMySharedLinks(sorted);
        if (sorted.length > 0 && !latestShareUrl) {
          setLatestShareUrl(getShareUrl(sorted[0].code));
          setLatestCode(sorted[0].code);
        }
      } else {
        setMySharedLinks([]);
      }
    } catch (e) {
      console.warn("Failed to load share links:", e);
    }
  };

  useEffect(() => {
    loadMySharedLinks();
  }, [currentUser]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setSuccessMsg('লিংক ক্লিপবোর্ডে কপি করা হয়েছে!');
    setTimeout(() => {
      setCopiedUrl(null);
      setSuccessMsg('');
    }, 2500);
  };

  // Generate unique share token
  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 7; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `NIPA-${rand}`;
  };

  // Create new share link
  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setIsCreatingLink(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Fetch password from RTDB or profile
      const userSnap = await get(ref(db, `users/${currentUser.uid}`));
      const userData = userSnap.val() || {};
      const actualPassword = userData.password || userProfile.password;

      if (!actualPassword) {
        throw new Error("অ্যাকাউন্ট শেয়ার করার জন্য আপনার পাসওয়ার্ড প্রয়োজন। দয়া করে Account Details পেজ থেকে পাসওয়ার্ডটি কনফার্ম করুন।");
      }

      const newCode = generateToken();
      const now = Date.now();
      const expiresAt = expiryDays === 0 ? 0 : now + (expiryDays * 24 * 60 * 60 * 1000);

      const linkData: SharedLinkData = {
        code: newCode,
        ownerUid: currentUser.uid,
        ownerName: userProfile.fullName || userProfile.username || 'User',
        ownerEmail: currentUser.email || `${userProfile.username}@nipa.app`,
        createdAt: now,
        expiresAt: expiresAt,
        accessPass: actualPassword,
        isActive: true,
        sharedNote: shareNote.trim() || 'Direct Account Share Link',
        useCount: 0
      };

      // Save to global lookup and user's private list
      await set(ref(db, `public_share_codes/${newCode}`), linkData);
      await set(ref(db, `user_share_codes/${currentUser.uid}/${newCode}`), linkData);

      const url = getShareUrl(newCode);
      setLatestShareUrl(url);
      setLatestCode(newCode);
      setSuccessMsg("নতুন শেয়ার লিংক সফলভাবে তৈরি হয়েছে! নিচে লিংকটি কপি করুন।");
      setShareNote('');
      await loadMySharedLinks();
    } catch (err: any) {
      console.error("Create share link error:", err);
      setErrorMsg(err.message || "শেয়ার লিংক তৈরিতে ত্রুটি হয়েছে।");
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Revoke/Delete share link
  const handleRevokeShareLink = async (code: string) => {
    if (!currentUser) return;
    if (!window.confirm("আপনি কি নিশ্চিত যে এই শেয়ার লিংকটি বাতিল করতে চান? এরপর এই লিংকে ক্লিক করলে আর অ্যাকাউন্টে ঢোকা যাবে না।")) {
      return;
    }

    try {
      await remove(ref(db, `public_share_codes/${code}`));
      await remove(ref(db, `user_share_codes/${currentUser.uid}/${code}`));
      setSuccessMsg("শেয়ার লিংক সফলভাবে বাতিল করা হয়েছে।");
      if (latestCode === code) {
        setLatestShareUrl(null);
        setLatestCode(null);
      }
      await loadMySharedLinks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg("লিংক বাতিল করতে ব্যর্থ: " + e.message);
    }
  };

  const currentEmail = currentUser?.email || (userProfile?.username ? `${userProfile.username}@nipa.app` : 'User');

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-5 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-600" />
            Account Share Link (অ্যাকাউন্ট শেয়ারিং লিংক)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            URL লিংকের মাধ্যমে যে কাউকে সরাসরি আপনার অ্যাকাউন্টে এক ক্লিকে অ্যাক্সেস দিন
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          One-Click URL
        </span>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Owner Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={userProfile?.fullName || userProfile?.username || 'Owner'}
            avatarIndex={userProfile?.avatarIndex || 0}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {userProfile?.fullName || userProfile?.username}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                Account Owner
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{currentEmail}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-semibold text-slate-400">শেয়ারযোগ্য অ্যাকাউন্ট</span>
        </div>
      </div>

      {/* PRIMARY FEATURE: Generated Share URL Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 rounded-2xl border-2 border-indigo-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              আপনার ডিরেক্ট অ্যাকাউন্ট শেয়ার লিংক
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
            Direct Access URL
          </span>
        </div>

        {latestShareUrl ? (
          <div className="space-y-3">
            {/* The URL Box */}
            <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-xl p-2 sm:p-2.5 shadow-xs">
              <input
                type="text"
                readOnly
                value={latestShareUrl}
                className="flex-1 bg-transparent border-0 text-xs font-mono font-bold text-indigo-950 focus:outline-none select-all px-2 truncate"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(latestShareUrl, 'primary_copy')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                {copiedUrl === 'primary_copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>লিংক কপি</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* WhatsApp Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`এখানে ক্লিক করে সরাসরি আমার NIPA অ্যাকাউন্টে যুক্ত হোন:\n${latestShareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp-এ শেয়ার করুন</span>
              </a>

              {/* Open in New Window to test */}
              <a
                href={latestShareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>লিংক টেস্ট করুন (খুলুন)</span>
              </a>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed font-medium">
              💡 <strong>কীভাবে কাজ করবে:</strong> এই লিংকটি যাকে পাঠাবেন, সে যেকোনো ব্রাউজারে লিংকে ক্লিক করলেই পাসওয়ার্ড ছাড়াই সরাসরি আপনার এই অ্যাকাউন্টে লগইন হয়ে যাবে!
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
            <p className="text-xs font-medium">এখনো কোনো শেয়ার লিংক তৈরি করেননি।</p>
            <p className="text-[11px] text-slate-400 mt-1">নিচে মেয়াদ নির্বাচন করে "নতুন শেয়ার লিংক তৈরি করুন" বাটনে ক্লিক করুন।</p>
          </div>
        )}
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            নতুন শেয়ার লিংক কনফিগারেশন
          </h4>
        </div>

        <form onSubmit={handleCreateShareLink} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              লিংকের মেয়াদকাল (Link Expiration)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '২৪ ঘণ্টা (24h)', days: 1 },
                { label: '৭ দিন (7 Days)', days: 7 },
                { label: 'আজীবন (Unlimited)', days: 0 }
              ].map((exp) => (
                <button
                  key={exp.days}
                  type="button"
                  onClick={() => setExpiryDays(exp.days)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    expiryDays === exp.days
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              লিংকের জন্য নোট / ট্যাগ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="যেমন: বন্ধুর জন্য, মোবাইল ডিভাইসের জন্য, অফিসের জন্য"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingLink}
            className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isCreatingLink ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ইউআরএল তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                <span>নতুন শেয়ার লিংক তৈরি করুন (Generate Link)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Share Links List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              আপনার সক্রিয় শেয়ার লিংকসমূহ ({mySharedLinks.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={loadMySharedLinks}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {mySharedLinks.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            এখনো কোনো সক্রিয় শেয়ার লিংক তৈরি করা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {mySharedLinks.map((sl) => {
              const url = getShareUrl(sl.code);
              const isExpired = sl.expiresAt > 0 && sl.expiresAt < Date.now();

              return (
                <div key={sl.code} className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 truncate max-w-[200px] sm:max-w-xs">
                        {url}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Expired</span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sl.sharedNote} • ক্লিক/ব্যবহার: {sl.useCount || 0} বার
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(url, sl.code)}
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="লিংক কপি করুন"
                    >
                      {copiedUrl === sl.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeShareLink(sl.code)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="লিংক বাতিল করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
