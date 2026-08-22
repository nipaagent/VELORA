const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const stateTarget = `  const [kbContent, setKbContent] = useState('');
  const [kbAttachments, setKbAttachments] = useState<Attachment[]>([]);`;
const stateReplacement = `  const [kbContent, setKbContent] = useState('');
  const [kbAttachments, setKbAttachments] = useState<Attachment[]>([]);
  const [isUploadingKbFile, setIsUploadingKbFile] = useState(false);`;
code = code.replace(stateTarget, stateReplacement);

const uploadTarget = `  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        
        const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
        const isTextFile = textTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

        if (file.type.startsWith('image/')) {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'image',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        } else if (isTextFile) {
          const textReader = new FileReader();
          textReader.onload = (e) => {
            const text = e.target?.result as string;
            if (text && typeof text === 'string') {
              setKbContent(prev => prev ? prev + "\\n\\n" + text : text);
            }
          };
          textReader.readAsText(file);
        } else {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'file',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        }
        
        if (!kbTitle) {
          setKbTitle(file.name.split('.')[0]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = ''; // reset
  };`;

const uploadReplacement = `  const handleKbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingKbFile(true);

    const newAttachments: Attachment[] = [];
    let newTextContent = "";
    let suggestedTitle = kbTitle;
    
    const readPromises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(\`ফাইল \${file.name} ৫ মেগাবাইটের বেশি হতে পারবে না।\`);
          resolve();
          return;
        }

        if (!suggestedTitle) {
          suggestedTitle = file.name.split('.')[0];
        }
        
        const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
        const isTextFile = textTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            newAttachments.push({
              id: crypto.randomUUID(),
              type: 'image',
              url: event.target?.result as string,
              name: file.name,
              mimeType: file.type
            });
            resolve();
          };
          reader.readAsDataURL(file);
        } else if (isTextFile) {
          const textReader = new FileReader();
          textReader.onload = (e) => {
            const text = e.target?.result as string;
            if (text && typeof text === 'string') {
              newTextContent += (newTextContent ? "\\n\\n" : "") + text;
            }
            resolve();
          };
          textReader.readAsText(file);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            newAttachments.push({
              id: crypto.randomUUID(),
              type: 'file',
              url: event.target?.result as string,
              name: file.name,
              mimeType: file.type
            });
            resolve();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    await Promise.all(readPromises);
    
    if (newAttachments.length > 0) {
      setKbAttachments(prev => [...prev, ...newAttachments]);
    }
    if (newTextContent) {
      setKbContent(prev => prev ? prev + "\\n\\n" + newTextContent : newTextContent);
    }
    if (!kbTitle && suggestedTitle) {
      setKbTitle(suggestedTitle);
    }
    
    setIsUploadingKbFile(false);
    e.target.value = ''; // reset
  };`;
code = code.replace(uploadTarget, uploadReplacement);

const uiTarget = `                    <div className="flex items-center justify-between">
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
                    </div>`;
                    
const uiReplacement = `                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">ছবি বা ফাইল আপলোড করুন</span>
                      <label className={\`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors \${isUploadingKbFile ? 'opacity-50 pointer-events-none' : ''}\`}>
                        {isUploadingKbFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        {isUploadingKbFile ? 'আপলোড হচ্ছে...' : 'আপলোড'}
                        <input 
                          type="file" 
                          multiple
                          disabled={isUploadingKbFile}
                          className="hidden" 
                          accept="image/*,.txt,.md,.csv,.json,.pdf,.doc,.docx" 
                          onChange={handleKbFileUpload} 
                        />
                      </label>
                    </div>`;
code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
console.log("Successfully patched SettingsPage.tsx with loading states");
