const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// 1. Revert attachments state
const stateTarget = `  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);`;
code = code.replace(stateTarget, "");

// 2. Revert handleFileUpload and removeAttachment
const handleTarget = /  const handleFileUpload = \([\s\S]*?const handleSubmit =/g;
code = code.replace(handleTarget, "  const handleSubmit =");

// 3. Revert handleSubmit
const submitTarget = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
  };`;
const submitReplacement = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim());
    setInput('');
  };`;
code = code.replace(submitTarget, submitReplacement);

// 4. Revert form rendering
const formTarget = /          \{attachments\.length > 0 && \([\s\S]*?          <form \n            onSubmit=\{handleSubmit\}/;
const formReplacement = `          <form \n            onSubmit={handleSubmit}`;
code = code.replace(formTarget, formReplacement);

// 5. Revert textarea and button
const inputTarget = `            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 outline-none"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}`;
const inputReplacement = `            <textarea\n              value={input}`;
code = code.replace(inputTarget, inputReplacement);

// 6. Revert disabled button
const buttonDisabledTarget = `disabled={(!input.trim() && attachments.length === 0) || isLoading}`;
const buttonDisabledReplacement = `disabled={!input.trim() || isLoading}`;
code = code.replace(buttonDisabledTarget, buttonDisabledReplacement);

const conditionTarget = `(input.trim() || attachments.length > 0) && !isLoading`;
const conditionReplacement = `input.trim() && !isLoading`;
code = code.replace(new RegExp(conditionTarget.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&'), 'g'), conditionReplacement);

// 7. Revert message mapping (remove attachment preview)
const msgTarget = /                        <div className="flex flex-col gap-2">[\s\S]*?<p className="whitespace-pre-wrap leading-relaxed">\{msg\.text\}<\/p>\n                        <\/div>/;
const msgReplacement = `<p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>`;
code = code.replace(msgTarget, msgReplacement);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully reverted ChatArea.tsx");
