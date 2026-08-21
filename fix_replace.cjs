const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// The messed up replacement inserted v1.2 card right before the first occurrence of:
// '<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">'
// Let's find Velora v1.2 in the file and remove it.

const badCard = `
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
              <div className="p-5 bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    Coming Soon
                  </div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Velora v1.2</h2>
                  <p className="text-violet-100 text-sm leading-relaxed max-w-sm font-medium">
                    খুব শীঘ্রই আসছে নতুন আপডেটেড ভার্সন Velora v1.2! আপাতত এতে কোনো নতুন ফিচার যোগ হয়নি, তবে পরবর্তী দারুণ সব আপডেটের জন্য প্রস্তুত থাকুন।
                  </p>
                </div>
              </div>
            </div>
            
            `;

if (code.includes('Velora v1.2')) {
  code = code.replace(badCard, '');
}

// Now let's remove the old v1.2 future updates correctly.
const removeStartStr = '                <div className="flex gap-4">\n                  <div className="shrink-0 mt-1">\n                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">\n                      <Clock className="w-4 h-4" />';
const removeEndStr = 'ভবিষ্যতে আরও নতুন ফিচার আসলে এই পেজেই নোটিফিকেশন এবং বিস্তারিত তথ্য পেয়ে যাবেন।\n                    </p>\n                  </div>\n                </div>';

const startIndex = code.indexOf(removeStartStr);
const endIndex = code.indexOf(removeEndStr) + removeEndStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
}

// Now insert properly inside currentView === 'tips'
const tipsStart = `
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Tips & Updates
            </h3>
`;

const properV12Card = tipsStart + badCard;
code = code.replace(tipsStart, properV12Card);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
