const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const targetBlockStart = '<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">';
const targetBlockEnd = '</div>\n            </div>\n            \n                        \n            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">';

const targetIndex = code.indexOf(targetBlockStart);
const endIndex = code.indexOf(targetBlockEnd, targetIndex);

if (targetIndex !== -1 && endIndex !== -1) {
  const newV12 = `
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
              <div className="p-5 bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    New Update
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Velora v1.2</h2>
                  <p className="text-violet-100 text-sm leading-relaxed max-w-sm font-medium">
                    এআই মেমরি এবং কাস্টম ডাটা ম্যানেজমেন্ট সহ আরো অনেক নতুন ফিচার যুক্ত করা হয়েছে।
                  </p>
                </div>
              </div>
              
              <div className="p-5 space-y-5">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">কাস্টম ডাটা ইনপুট ও ম্যানেজমেন্ট</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      ডাটা ইনপুট সিস্টেমটি আরও হার্ডি এবং মজবুত করা হয়েছে। এখন আপনি চাইলে একাধিক ডাটা সেভ করে রাখতে পারবেন, যেকোনো সময় ডিলিট করতে পারবেন এবং প্রয়োজন অনুযায়ী যেকোনো একটিকে 'অ্যাকটিভ' হিসেবে সিলেক্ট করে চ্যাটে ব্যবহার করতে পারবেন। এআই ঠিক সেই ডাটার ওপর ভিত্তি করেই ভেবেচিন্তে রিপ্লাই দেবে।
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Cpu className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">এআই মেমরি (ক্রস-চ্যাট সিঙ্ক)</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      আগের চ্যাটে বলা বিশেষ কোনো তথ্য (যেমন: আপনার নাম, পছন্দ-অপছন্দ) এআই এখন ১০০% পারফেক্টলি মনে রাখবে! নতুন চ্যাট শুরু করলেও আগের চ্যাটের সাথে মিল রেখে কথা বলতে পারবে। আপনি চাইলে এআই মেমরি সেকশন থেকে দেখা ও ক্লিয়ারও করতে পারবেন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
`;
  
  code = code.substring(0, targetIndex) + newV12.trim() + '\n            \n            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">' + code.substring(endIndex + targetBlockEnd.length);
  fs.writeFileSync('src/components/SettingsPage.tsx', code);
}
