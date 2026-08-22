const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

const stateTarget = `  const [attachments, setAttachments] = useState<(Attachment & { size?: number })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);`;
const stateReplacement = `  const [attachments, setAttachments] = useState<(Attachment & { size?: number })[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);`;
code = code.replace(stateTarget, stateReplacement);

const uploadTarget = `  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: base64Url,
          name: file.name,
          mimeType: file.type,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };`;

const uploadReplacement = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsAttaching(true);
    
    const newAttachments: (Attachment & { size?: number })[] = [];
    
    const readPromises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(\`ফাইল \${file.name} ৫ মেগাবাইটের বেশি হতে পারবে না।\`);
          resolve();
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          newAttachments.push({
            id: crypto.randomUUID(),
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: event.target?.result as string,
            name: file.name,
            mimeType: file.type,
            size: file.size
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(readPromises);
    
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    
    setIsAttaching(false);
    e.target.value = '';
  };`;
code = code.replace(uploadTarget, uploadReplacement);

const uiTarget = `            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 outline-none"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>`;

const uiReplacement = `            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAttaching}
              className={\`p-2 transition-colors shrink-0 outline-none \${isAttaching ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}\`}
              title="Attach files"
            >
              {isAttaching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>`;
code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx with loading states");
