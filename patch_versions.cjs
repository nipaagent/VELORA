const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// 1. Remove the old v1.2 and future updates from the bottom of v1.1
const removeStartStr = '                <div className="flex gap-4">\n                  <div className="shrink-0 mt-1">\n                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">\n                      <Clock className="w-4 h-4" />';
const removeEndStr = 'ভবিষ্যতে আরও নতুন ফিচার আসলে এই পেজেই নোটিফিকেশন এবং বিস্তারিত তথ্য পেয়ে যাবেন।\n                    </p>\n                  </div>\n                </div>';

const startIndex = code.indexOf(removeStartStr);
const endIndex = code.indexOf(removeEndStr) + removeEndStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
}

// 2. We need to make sure v1.1 is now pushed down by adding 'mb-5' or it's wrapped properly, but both are separate cards so it's fine.
// Replace the start of v1.1 card with the v1.2 card followed by the v1.1 card.
const v11Start = '<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">';

const v12Card = `
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

code = code.replace(v11Start, v12Card.trim() + '\n            \n            ' + v11Start);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
