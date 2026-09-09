import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, UserCheck, Bot, 
  Gift, KeyRound, Copy, CheckCircle2, RefreshCw, Database
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SystemControl } from '../../types';

interface AdminSecurityTabProps {
  systemControl: SystemControl;
  onUpdateSystemControl: (control: SystemControl) => Promise<void>;
  isSaving: boolean;
  onSeedDemoUsers?: () => Promise<void>;
}

export const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({
  systemControl,
  onUpdateSystemControl,
  isSaving,
  onSeedDemoUsers
}) => {
  const [control, setControl] = useState<SystemControl>({
    maintenanceMode: systemControl?.maintenanceMode ?? false,
    maintenanceNotice: systemControl?.maintenanceNotice ?? 'সার্ভার রক্ষণাবেক্ষণের কাজ চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।',
    allowRegistration: systemControl?.allowRegistration ?? true,
    aiChatEnabled: systemControl?.aiChatEnabled ?? true,
    adRewardsEnabled: systemControl?.adRewardsEnabled ?? true
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const recaptchaSiteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  const recaptchaSecretKey = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggle = async (key: keyof SystemControl) => {
    const updated = {
      ...control,
      [key]: !control[key],
      updatedAt: Date.now()
    };
    setControl(updated);
    await onUpdateSystemControl(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveNotice = async () => {
    await onUpdateSystemControl({
      ...control,
      updatedAt: Date.now()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Realtime Feature Gates & System Switches */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              সিস্টেম কন্ট্রোল ও লাইভ সুইচবোর্ড
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              এখান থেকে অ্যাপের যেকোনো ফিচার তাৎক্ষণিক চালু বা বন্ধ করা যাবে।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Maintenance Mode */}
          <div className={cn(
            "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
            control.maintenanceMode ? "bg-rose-50 border-rose-200 shadow-xs" : "bg-slate-50 border-slate-200/80"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", control.maintenanceMode ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-600")}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">মেইনটেন্যান্স মোড (Maintenance)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  চালু করলে সাধারণ ইউজাররা নোটিশ দেখতে পাবে (অ্যাডমিন ছাড়া)।
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('maintenanceMode')}
              disabled={isSaving}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer",
                control.maintenanceMode
                  ? "bg-rose-600 text-white border-rose-500 hover:bg-rose-700"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              )}
            >
              {control.maintenanceMode ? 'সক্রিয় (Active)' : 'বন্ধ (Off)'}
            </button>
          </div>

          {/* User Registration Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", control.allowRegistration ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">নতুন ইউজার রেজিস্ট্রেশন</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  নতুন একাউন্ট খোলা চালু বা সাময়িক স্থগিত রাখুন।
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('allowRegistration')}
              disabled={isSaving}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer",
                control.allowRegistration
                  ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                  : "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
              )}
            >
              {control.allowRegistration ? 'চালু রয়েছে' : 'স্থগিত'}
            </button>
          </div>

          {/* AI Chat Engine */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", control.aiChatEnabled ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600")}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">AI চ্যাট সার্ভিস ইঞ্জিন</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  AI মডেল রেসপন্স ইঞ্জিন সাময়িক বন্ধ বা চালু রাখুন।
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('aiChatEnabled')}
              disabled={isSaving}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer",
                control.aiChatEnabled
                  ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700"
                  : "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
              )}
            >
              {control.aiChatEnabled ? 'চালু রয়েছে' : 'স্থগিত'}
            </button>
          </div>

          {/* Ad Reward Engine */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", control.adRewardsEnabled ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600")}>
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">বিজ্ঞাপন বোনাস সিস্টেম</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  অ্যাড দেখার মাধ্যমে ইউজারদের টোকেন রিওয়ার্ড প্রদান।
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('adRewardsEnabled')}
              disabled={isSaving}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer",
                control.adRewardsEnabled
                  ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600 font-black"
                  : "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
              )}
            >
              {control.adRewardsEnabled ? 'চালু রয়েছে' : 'স্থগিত'}
            </button>
          </div>
        </div>

        {/* Maintenance notice editor */}
        {control.maintenanceMode && (
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
            <label className="text-xs font-bold text-rose-900">
              মেইনটেন্যান্স নোটিশ বার্তা (ইউজারদের যা দেখানো হবে)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={control.maintenanceNotice}
                onChange={(e) => setControl({ ...control, maintenanceNotice: e.target.value })}
                className="flex-1 px-3.5 py-2 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleSaveNotice}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Google reCAPTCHA Credentials */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Google reCAPTCHA সিকিউরিটি ক্রেডেনশিয়াল
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              বট আক্রমণ ও স্প্যামিং প্রতিরোধে ব্যবহৃত অফিসিয়াল কি সমূহ।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              reCAPTCHA Site Key (Client-Side)
            </span>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
              <span className="font-mono text-xs font-semibold text-slate-800 truncate pr-2">
                {recaptchaSiteKey}
              </span>
              <button
                onClick={() => handleCopy(recaptchaSiteKey, 'site')}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="কপি করুন"
              >
                {copiedKey === 'site' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              reCAPTCHA Secret Key (Server-Side)
            </span>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
              <span className="font-mono text-xs font-semibold text-slate-800 truncate pr-2">
                {recaptchaSecretKey.slice(0, 10)}•••••••••••••••••
              </span>
              <button
                onClick={() => handleCopy(recaptchaSecretKey, 'secret')}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="কপি করুন"
              >
                {copiedKey === 'secret' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Database & System Seeding */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                ফায়ারবেস ক্লাউড ডেটাবেস ইঞ্জিন
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Firebase Realtime Database (RTDB) ইনস্ট্যান্স সক্রিয় রয়েছে।
              </p>
            </div>
          </div>

          {onSeedDemoUsers && (
            <button
              onClick={onSeedDemoUsers}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ডেমো অ্যাকাউন্ট সিড করুন</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
          <div>• ডেটাবেস পাথ: <span className="font-mono text-indigo-300">/users</span>, <span className="font-mono text-indigo-300">/settings</span>, <span className="font-mono text-indigo-300">/redeem_codes</span></div>
          <div>• ক্লাউড অঞ্চল: <span className="font-mono text-slate-300">asia-southeast1</span> (সিঙ্গাপুর - সর্বোচ্চ স্পিড ও সর্বনিম্ন ল্যাটেন্সি)</div>
          <div>• নিরাপত্তা পলিসি: অ্যাডমিন প্রোটোকল দ্বারা সম্পূর্ণ এনক্রিপ্টেড।</div>
        </div>
      </div>
    </div>
  );
};
