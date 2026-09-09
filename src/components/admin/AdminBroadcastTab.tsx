import React, { useState } from 'react';
import { 
  Radio, Megaphone, Bell, CheckCircle2, 
  ExternalLink, Sparkles, AlertTriangle, AlertCircle, Info, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { SystemAnnouncement } from '../../types';

interface AdminBroadcastTabProps {
  announcement: SystemAnnouncement;
  onSaveAnnouncement: (data: SystemAnnouncement) => Promise<void>;
  isSaving: boolean;
}

export const AdminBroadcastTab: React.FC<AdminBroadcastTabProps> = ({
  announcement,
  onSaveAnnouncement,
  isSaving
}) => {
  const [formData, setFormData] = useState<SystemAnnouncement>({
    isActive: announcement?.isActive ?? false,
    title: announcement?.title ?? '',
    message: announcement?.message ?? '',
    type: announcement?.type ?? 'info',
    linkUrl: announcement?.linkUrl ?? '',
    linkText: announcement?.linkText ?? 'বিস্তারিত দেখুন',
    updatedAt: announcement?.updatedAt ?? Date.now()
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveAnnouncement({
      ...formData,
      updatedAt: Date.now()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClear = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে বর্তমান ব্রডকাস্ট বার্তাটি মুছে ফেলতে চান?")) return;
    const cleared: SystemAnnouncement = {
      isActive: false,
      title: '',
      message: '',
      type: 'info',
      linkUrl: '',
      linkText: '',
      updatedAt: Date.now()
    };
    setFormData(cleared);
    await onSaveAnnouncement(cleared);
  };

  const types = [
    { id: 'info', label: 'সাধারণ নোটিশ (Info)', icon: Info, color: 'border-sky-300 text-sky-700 bg-sky-50' },
    { id: 'warning', label: 'সতর্কবার্তা (Warning)', icon: AlertTriangle, color: 'border-amber-300 text-amber-700 bg-amber-50' },
    { id: 'alert', label: 'জরুরি অ্যালার্ট (Urgent)', icon: AlertCircle, color: 'border-rose-300 text-rose-700 bg-rose-50' },
    { id: 'promo', label: 'প্রমোশনাল অফার (Promo)', icon: Sparkles, color: 'border-purple-300 text-purple-700 bg-purple-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                লাইভ সিস্টেম ব্রডকাস্ট ও গ্লোবাল নোটিস
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  formData.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                )}>
                  {formData.isActive ? '● লাইভ সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                এখান থেকে দেওয়া নোটিশ সকল ইউজারের স্ক্রিনে তাৎক্ষণিক রিয়েলটাইমে ভেসে উঠবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <input 
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">
                {formData.isActive ? 'ব্রডকাস্ট চালু রয়েছে' : 'ব্রডকাস্ট বন্ধ'}
              </span>
            </label>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>ইউজারদের জন্য লাইভ প্রিভিউ (Preview)</span>
            <span className="text-[11px] text-slate-400">এভাবে ইউজারের পর্দায় দেখাবে</span>
          </div>

          <div className={cn(
            "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs",
            formData.type === 'info' && "bg-sky-50/90 border-sky-200 text-sky-950",
            formData.type === 'warning' && "bg-amber-50/90 border-amber-200 text-amber-950",
            formData.type === 'alert' && "bg-rose-50/90 border-rose-200 text-rose-950",
            formData.type === 'promo' && "bg-purple-50/90 border-purple-200 text-purple-950"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-xl shrink-0 mt-0.5",
                formData.type === 'info' && "bg-sky-200/60 text-sky-700",
                formData.type === 'warning' && "bg-amber-200/60 text-amber-700",
                formData.type === 'alert' && "bg-rose-200/60 text-rose-700",
                formData.type === 'promo' && "bg-purple-200/60 text-purple-700"
              )}>
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black tracking-wide">
                  {formData.title.trim() || 'নোটিশের শিরোনাম এখানে প্রদর্শিত হবে'}
                </div>
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  {formData.message.trim() || 'আপনার বিস্তারিত ঘোষণা বার্তাটি এখানে দেখা যাবে। যেকোনো জরুরি আপডেট বা নোটিফিকেশন শেয়ার করুন।'}
                </div>
              </div>
            </div>

            {formData.linkUrl && (
              <a
                href={formData.linkUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-2xs border transition-all self-start sm:self-center",
                  formData.type === 'info' && "bg-sky-600 hover:bg-sky-700 text-white border-sky-500",
                  formData.type === 'warning' && "bg-amber-600 hover:bg-amber-700 text-white border-amber-500",
                  formData.type === 'alert' && "bg-rose-600 hover:bg-rose-700 text-white border-rose-500",
                  formData.type === 'promo' && "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                )}
              >
                <span>{formData.linkText || 'ক্লিক করুন'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">নোটিশের ধরন (Notice Type)</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => {
                  const Icon = t.icon;
                  const isSelected = formData.type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFormData({ ...formData, type: t.id as any })}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
                        isSelected 
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">শিরোনাম (Headline / Title)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: সার্ভার আপগ্রেড নোটিশ অথবা বিশেষ ঈদ অফার!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">বিস্তারিত নোটিশ বার্তা (Notice Body Text)</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="ইউজারদের উদ্দেশ্যে আপনার বিস্তারিত বার্তা লিখুন..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">একশন লিংক (Optional Action URL)</label>
              <input
                type="url"
                value={formData.linkUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://t.me/your_channel অথবা প্রোমো পেজ লিংক"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">বাটন টেক্সট (Action Button Text)</label>
              <input
                type="text"
                value={formData.linkText || ''}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="যেমন: জয়েন করুন, বিস্তারিত দেখুন"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>নোটিশ ক্লিয়ার করুন</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>সফলভাবে লাইভ ব্রডকাস্ট হয়েছে!</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ফায়ারবেসে লাইভ ব্রডকাস্ট করুন'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
