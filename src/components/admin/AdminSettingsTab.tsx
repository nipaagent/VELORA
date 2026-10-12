import React from 'react';
import { 
  Settings, DollarSign, Gift, Database, 
  Code2, Crown, Coins, ShieldCheck, Download, 
  ExternalLink, Layers, CheckCircle2 
} from 'lucide-react';
import { SP_VIP_PACKAGES, SP_TOKEN_PACKAGES } from '../../lib/spPaymentConfig';

interface AdminSettingsTabProps {
  onExportUsers: () => void;
  onNavigateTab: (tabId: any) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  onExportUsers,
  onNavigateTab
}) => {
  return (
    <div className="space-y-4 max-w-5xl">
      {/* Quick Nav Anchors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
        <a href="#section-pricing" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-colors">VIP প্ল্যান ও প্রাইসিং</a>
        <a href="#section-tokenpacks" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-colors">টোকেন প্যাক</a>
        <a href="#section-refer" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-colors">রেফারেল প্রোগ্রাম</a>
        <a href="#section-data" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-colors">ডাটা এক্সপোর্ট ও ব্যাকআপ</a>
        <a href="#section-developer" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-colors">ডেভেলপার হাব</a>
      </div>

      {/* 1. VIP Pricing Section */}
      <div id="section-pricing" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">VIP প্যাকেজ কনফিগারেশন</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">১ SP = ৳৭.৭৭ BDT</span>
        </div>
        <p className="text-xs text-slate-500">
          SP Wallet BD গেটওয়ের সাথে সমন্বিত অফিশিয়াল প্যাকেজ তালিকা।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {SP_VIP_PACKAGES.map(pkg => (
            <div key={pkg.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-800">{pkg.name}</div>
                <div className="text-xl font-mono font-black text-slate-900 mt-1">৳{pkg.priceBdt}</div>
                <div className="text-[11px] text-slate-500 font-mono">{pkg.priceSp} SP · {pkg.days} দিন</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-indigo-700 font-semibold">
                দৈনিক ৫ লাখ টোকেন কোটা
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Token Packs Section */}
      <div id="section-tokenpacks" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">টোকেন প্যাক তালিকা</h3>
        </div>
        <p className="text-xs text-slate-500">
          ইউজারদের জন্য স্থায়ী লাইফটাইম টোকেন প্যাক (মেয়াদ শেষ হয় না)।
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {SP_TOKEN_PACKAGES.map(pkg => (
            <div key={pkg.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center">
              <div className="font-bold text-slate-900 font-mono text-sm">{pkg.name}</div>
              <div className="font-mono font-bold text-slate-700 mt-1">৳{pkg.priceBdt}</div>
              <div className="text-[10px] text-slate-500 font-mono">{pkg.priceSp} SP</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Refer & Earn Section */}
      <div id="section-refer" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">রেফারেল প্রোগ্রাম সেটিংস</h3>
        </div>
        <p className="text-xs text-slate-500">
          প্রতিটি সফল রেফারেলে ইউজার পায় ১ লাখ ফ্রি বোনাস টোকেন এবং ১০+ রেফারেলে ৩ দিন, ২০+ রেফারেলে ১০ দিন VIP অ্যাক্সেস।
        </p>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
          <div>• <b>রেফারার বোনাস:</b> +১০০,০০০ বোনাস টোকেন (তাৎক্ষণিক)</div>
          <div>• <b>নতুন ইউজার রিওয়ার্ড:</b> ১ দিন VIP সুবিধা</div>
          <div>• <b>মাইলেস্টোন:</b> ১০/২০/৩০ রেফারেল সম্পন্ন হলে অতিরিক্ত VIP মেম্বারশিপ</div>
        </div>
      </div>

      {/* 4. Data Export & Backup Section */}
      <div id="section-data" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ডাটা এক্সপোর্ট ও ব্যাকআপ</h3>
        </div>
        <p className="text-xs text-slate-500">
          আপনার Firebase ডাটাবেজের ইউজার তালিকা এবং হিসাব এক ক্লিকে JSON ফরম্যাটে অফলাইন ব্যাকআপ নিন।
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportUsers}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ইউজার ব্যাকআপ ডাউনলোড (JSON)</span>
          </button>
        </div>
      </div>

      {/* 5. Developer Hub Section */}
      <div id="section-developer" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ডেভেলপার হাব ও API তথ্য</h3>
          </div>
          <button 
            onClick={() => onNavigateTab('apikeys')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
          >
            গেটওয়ে কী কনফিগ দেখুন →
          </button>
        </div>
        <p className="text-xs text-slate-500">
          NIPA REST API এন্ডপয়েন্ট ব্যবহার করে যেকোনো থার্ড পার্টি সিস্টেমে AI চ্যাট যুক্ত করা যায়।
        </p>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
          <div><b>Base URL:</b> https://velora.bro.bd/api</div>
          <div><b>Chat Endpoint:</b> POST /api/chat (OpenAI Compatible)</div>
          <div><b>Models Endpoint:</b> GET /api/models</div>
        </div>
      </div>
    </div>
  );
};
