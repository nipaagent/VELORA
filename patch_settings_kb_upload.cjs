const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// Ensure FileText icon is imported
if (!code.includes('FileText')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, FileText, UploadCloud } from 'lucide-react';");
}

const handleUploadTarget = `  const handleSetActiveKb = async (id: string) => {`;
const handleUploadReplacement = `
  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("ফাইল ২ মেগাবাইটের বেশি হতে পারবে না।");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setKbContent(prev => prev ? prev + "\\n\\n" + text : text);
        if (!kbTitle) {
          setKbTitle(file.name.split('.')[0]);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleSetActiveKb = async (id: string) => {`;
code = code.replace(handleUploadTarget, handleUploadReplacement);

const uiTarget = `                  <textarea
                    placeholder="বিস্তারিত ডাটা এখানে পেস্ট করুন..."`;
const uiReplacement = `                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">অথবা ফাইল থেকে ডাটা আপলোড করুন (.txt, .md, .csv)</span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      আপলোড ফাইল
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".txt,.md,.csv,.json" 
                        onChange={handleKbFileUpload} 
                      />
                    </label>
                  </div>
                  <textarea
                    placeholder="বিস্তারিত ডাটা এখানে পেস্ট করুন..."`;
code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
console.log("Successfully patched SettingsPage.tsx");
