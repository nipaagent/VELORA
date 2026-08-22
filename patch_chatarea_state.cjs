const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

const targetState = `  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);`;
const replacementState = `  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);`;
code = code.replace(targetState, replacementState);

const targetHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim());
    setInput('');
  };`;
const replacementHandleSubmit = `  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
  };`;
code = code.replace(targetHandleSubmit, replacementHandleSubmit);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx state and handlers");
