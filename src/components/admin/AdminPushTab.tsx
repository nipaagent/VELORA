import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { cn } from '../../lib/utils';

export const AdminPushTab: React.FC = () => {
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState<boolean>(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');

  // Sending status & Result
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to push_subscriptions in RTDB to get live subscriber count
  useEffect(() => {
    setIsLoadingSubscribers(true);
    const subsRef = ref(db, 'push_subscriptions');
    const unsub = onValue(subsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (typeof val === 'object' && val !== null) {
          setSubscriberCount(Object.keys(val).length);
        } else {
          setSubscriberCount(0);
        }
      } else {
        setSubscriberCount(0);
      }
      setIsLoadingSubscribers(false);
    }, (err) => {
      console.warn("Push subscriptions load error:", err);
      setIsLoadingSubscribers(false);
    });

    return () => unsub();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage("শিরোনাম এবং বার্তা উভয়ই আবশ্যক।");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setBroadcastResult(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("লগইন প্রয়োজন। দয়া করে আবার লগইন করুন।");
      }
      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/admin/push/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          title: title.trim(),
          body: message.trim(),
          url: url.trim() || '/'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ব্রডকাস্ট পাঠাতে সমস্যা হয়েছে।");
      }

      setBroadcastResult({
        sent: data.sent ?? 0,
        failed: data.failed ?? 0
      });

      // Clear form on success
      setTitle('');
      setMessage('');
      setUrl('');
    } catch (err: any) {
      console.error("Broadcast push error:", err);
      setErrorMessage(err.message || "পুশ নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 text-black">
      {/* Top Header Card - Strict Monochrome */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-black shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
                ওয়েব পুশ নোটিফিকেশন (VAPID)
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                সকল সাবস্ক্রাইব করা ইউজারের ডিভাইসে ২৪/৭ ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন ব্রডকাস্ট করুন।
              </p>
            </div>
          </div>

          {/* Subscriber Count Display */}
          <div className="flex items-center gap-2 bg-zinc-100 border border-black px-3.5 py-2 rounded-xl shrink-0">
            <Users className="w-4 h-4 text-black" />
            <div className="text-xs font-semibold">
              <span className="text-zinc-600">সাবস্ক্রাইবার সংখ্যা: </span>
              <span className="font-mono font-bold text-black text-sm">
                {isLoadingSubscribers ? '...' : subscriberCount.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleBroadcast} className="space-y-4 pt-5">
          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
              শিরোনাম (Title) <span className="text-black">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: নতুন আপডেট প্রকাশ করা হয়েছে!"
              className="w-full px-3.5 py-2.5 bg-white border border-black rounded-xl text-xs text-black placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
              disabled={isSending}
              required
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
              বার্তা (Message) <span className="text-black">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ব্যবহারকারীদের জন্য আপনার বার্তা লিখুন..."
              className="w-full px-3.5 py-2.5 bg-white border border-black rounded-xl text-xs text-black placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black transition-all resize-y"
              disabled={isSending}
              required
            />
          </div>

          {/* URL Field (Optional) */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
              লিংক (ঐচ্ছিক URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="যেমন: / অথবা https://velora.bro.bd"
              className="w-full px-3.5 py-2.5 bg-white border border-black rounded-xl text-xs text-black placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black transition-all font-mono"
              disabled={isSending}
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              ইউজার নোটিফিকেশনে ক্লিক করলে এই লিংকটি তার ব্রাউজারে ওপেন হবে।
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-zinc-100 border border-black rounded-xl text-xs text-black flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Broadcast Result */}
          {broadcastResult && (
            <div className="p-4 bg-zinc-50 border border-black rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-black">
                <CheckCircle2 className="w-4 h-4" />
                <span>ব্রডকাস্ট সম্পন্ন হয়েছে:</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono pt-1">
                <div className="bg-white border border-black px-2.5 py-1 rounded">
                  <span className="font-sans font-semibold">সফল: </span>
                  <span className="font-bold">{broadcastResult.sent}</span>
                </div>
                <div className="bg-white border border-black px-2.5 py-1 rounded">
                  <span className="font-sans font-semibold">ব্যর্থ: </span>
                  <span className="font-bold">{broadcastResult.failed}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSending || subscriberCount === 0}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 bg-black text-white hover:bg-zinc-800 border border-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs",
                (isSending || subscriberCount === 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>সবাইকে পাঠান</span>
                </>
              )}
            </button>
            {subscriberCount === 0 && !isLoadingSubscribers && (
              <p className="text-[11px] text-zinc-500 mt-2">
                এখনও কোনো ইউজার পুশ নোটিফিকেশন সাবস্ক্রাইব করেনি।
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
