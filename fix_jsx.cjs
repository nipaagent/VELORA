const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// The messed up section starts with "<div>                    <div className="flex gap-4">"
// Let's replace the whole section starting from `<div className="flex gap-4">` around line 830 down to the end.

const fixedCode = `
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Velora v1.2 (কামিং সুন)</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      খুব শীঘ্রই আসছে নতুন আপডেটেড ভার্সন Velora v1.2, যেখানে থাকবে আরও দারুণ কিছু চমক এবং আকর্ষণীয় ফিচারস!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">আগামীর আপডেট</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      ভবিষ্যতে আরও নতুন ফিচার আসলে এই পেজেই নোটিফিকেশন এবং বিস্তারিত তথ্য পেয়ে যাবেন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

// we will find the index of "রেফারেল সিস্টেম ফিক্স" and rebuild from there
const keyword = "রেফারেল সিস্টেম ফিক্স";
const idx = code.indexOf(keyword);
if (idx !== -1) {
  const cutoff = code.indexOf('<div className="flex gap-4">', idx + keyword.length);
  if (cutoff !== -1) {
    code = code.substring(0, cutoff) + fixedCode;
    fs.writeFileSync('src/components/SettingsPage.tsx', code);
  }
}
