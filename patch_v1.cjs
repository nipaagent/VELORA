const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// Change Velora 1.1 to Velora v1.1
code = code.replace("Velora 1.1", "Velora v1.1");

const v12Html = `
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
`;

code = code.replace(
  '<h4 className="text-sm font-bold text-gray-900 mb-1">আগামীর আপডেট</h4>',
  v12Html.trim() + '\n                \n                <div className="flex gap-4">\n                  <div className="shrink-0 mt-1">\n                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">\n                      <Info className="w-4 h-4" />\n                    </div>\n                  </div>\n                  <div>\n                    <h4 className="text-sm font-bold text-gray-900 mb-1">আগামীর আপডেট</h4>'
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
