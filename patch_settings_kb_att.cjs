const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

if (!code.includes('import { Attachment }')) {
  code = code.replace(/import \{([^}]+)\} from '\.\.\/types';/, "import { $1, Attachment } from '../types';");
}

if (!code.includes('import { X } from')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, X } from 'lucide-react';");
}

const stateTarget = `  const [kbContent, setKbContent] = useState('');`;
const stateReplacement = `  const [kbContent, setKbContent] = useState('');
  const [kbAttachments, setKbAttachments] = useState<Attachment[]>([]);`;
if (code.includes(stateTarget) && !code.includes('kbAttachments')) {
  code = code.replace(stateTarget, stateReplacement);
}

const fileUploadTarget = `  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };`;

const fileUploadReplacement = `  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(\`ফাইল \${file.name} ৫ মেগাবাইটের বেশি হতে পারবে না।\`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        
        if (file.type.startsWith('image/')) {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'image',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        } else {
          // If it's a text file, try to read as text
          const textReader = new FileReader();
          textReader.onload = (e) => {
            const text = e.target?.result as string;
            if (text && typeof text === 'string' && !text.includes('data:')) {
              setKbContent(prev => prev ? prev + "\\n\\n" + text : text);
            } else {
               setKbAttachments(prev => [...prev, {
                id: crypto.randomUUID(),
                type: 'file',
                url: base64Url,
                name: file.name,
                mimeType: file.type
              }]);
            }
          };
          textReader.readAsText(file);
        }
        
        if (!kbTitle) {
          setKbTitle(file.name.split('.')[0]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = ''; // reset
  };

  const removeKbAttachment = (id: string) => {
    setKbAttachments(prev => prev.filter(a => a.id !== id));
  };`;

code = code.replace(fileUploadTarget, fileUploadReplacement);

const saveTarget = `const newKb = { id: newId, title: kbTitle.trim(), content: kbContent.trim(), createdAt: Date.now() };`;
const saveReplacement = `const newKb = { id: newId, title: kbTitle.trim(), content: kbContent.trim(), createdAt: Date.now(), attachments: kbAttachments };`;
code = code.replace(saveTarget, saveReplacement);

const saveResetTarget = `      setKbTitle('');
      setKbContent('');`;
const saveResetReplacement = `      setKbTitle('');
      setKbContent('');
      setKbAttachments([]);`;
code = code.replace(saveResetTarget, saveResetReplacement);

const uiTarget = `                  <div className="flex items-center justify-between">
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
                  </div>`;
const uiReplacement = `                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">ছবি বা ফাইল আপলোড করুন</span>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        আপলোড
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          accept="image/*,.txt,.md,.csv,.json,.pdf,.doc,.docx" 
                          onChange={handleKbFileUpload} 
                        />
                      </label>
                    </div>
                    {kbAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-xl bg-slate-50">
                        {kbAttachments.map((att) => (
                          <div key={att.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                            {att.type === 'image' ? (
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-500">
                                <FileText className="w-6 h-6 mb-1" />
                                <span className="text-[8px] sm:text-[10px] text-center line-clamp-1 truncate w-full">{att.name}</span>
                              </div>
                            )}
                            <button 
                              type="button" 
                              onClick={() => removeKbAttachment(att.id)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>`;
code = code.replace(uiTarget, uiReplacement);


const viewKbTarget = `                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 ml-4">{kb.content}</p>
                        </div>`;
const viewKbReplacement = `                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 ml-4">
                            {kb.content || (kb.attachments && kb.attachments.length > 0 ? \`\${kb.attachments.length} files attached\` : "")}
                          </p>
                          {kb.attachments && kb.attachments.length > 0 && (
                            <div className="flex gap-1 ml-4 mt-2">
                              {kb.attachments.slice(0, 3).map(att => (
                                <div key={att.id} className="w-6 h-6 rounded overflow-hidden border border-slate-200">
                                  {att.type === 'image' ? (
                                    <img src={att.url} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center"><FileText className="w-3 h-3 text-slate-400" /></div>
                                  )}
                                </div>
                              ))}
                              {kb.attachments.length > 3 && <span className="text-[10px] text-slate-500 flex items-center ml-1">+{kb.attachments.length - 3}</span>}
                            </div>
                          )}
                        </div>`;
code = code.replace(viewKbTarget, viewKbReplacement);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
console.log("Successfully patched SettingsPage.tsx for attachments");
