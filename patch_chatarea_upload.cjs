const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Update imports
code = code.replace(/import \{ Chat, UserProfile \} from '\.\.\/types';/, "import { Chat, UserProfile, Attachment } from '../types';");

// Update ChatAreaProps
code = code.replace(/onSendMessage: \(text: string\) => void;/, "onSendMessage: (text: string, attachments?: Attachment[]) => void;");

// Add state and handlers
const stateTarget = `  const [input, setInput] = useState('');`;
const stateReplacement = `  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<(Attachment & { size?: number })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };`;
code = code.replace(stateTarget, stateReplacement);

// Update handleSubmit
const submitTarget = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim());
    setInput('');
  };`;
const submitReplacement = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
  };`;
code = code.replace(submitTarget, submitReplacement);

// Update form UI to include the preview and file input
const formTarget = `          <form 
            onSubmit={handleSubmit}`;
const formReplacement = `          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm max-h-40 overflow-y-auto custom-scrollbar">
              {attachments.map((att) => (
                <div key={att.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center pr-3 max-w-[200px] shadow-xs">
                  {att.type === 'image' ? (
                    <div className="w-12 h-12 shrink-0 border-r border-slate-200">
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-500 border-r border-slate-200">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="pl-3 pr-7 py-1.5 min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700 truncate" title={att.name}>{att.name}</p>
                    <p className="text-[9px] text-slate-500 font-medium">
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit}`;
code = code.replace(formTarget, formReplacement);

// Add the paperclip button and file input
const inputTarget = `            <textarea
              value={input}`;
const inputReplacement = `            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 outline-none"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}`;
code = code.replace(inputTarget, inputReplacement);

// Update button disable condition
code = code.replace(/disabled=\{\!input\.trim\(\) \|\| isLoading\}/g, "disabled={(!input.trim() && attachments.length === 0) || isLoading}");
code = code.replace(/input\.trim\(\) \&\& \!isLoading/g, "(input.trim() || attachments.length > 0) && !isLoading");

// Add sent message attachment rendering
const msgRenderTarget = `<p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>`;
const msgRenderReplacement = `<div className="flex flex-col gap-2">
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-1">
                              {msg.attachments.map((att) => (
                                <div key={att.id} className="relative group rounded-lg overflow-hidden border border-slate-200/50 bg-white/10 flex items-center pr-2 max-w-[200px]">
                                  {att.type === 'image' ? (
                                    <div className="w-10 h-10 shrink-0">
                                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white/20 text-current">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="pl-2 pr-1 py-1 min-w-0">
                                    <p className="text-[10px] font-medium truncate opacity-90">{att.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>`;
code = code.replace(msgRenderTarget, msgRenderReplacement);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx with file upload indicator");
