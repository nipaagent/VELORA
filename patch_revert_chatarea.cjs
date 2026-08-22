const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

code = code.replace(
  `  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<(Attachment & { size?: number })[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);`,
  `  const [input, setInput] = useState('');`
);

code = code.replace(/  const handleFileUpload = async[\s\S]*?const messagesEndRef = useRef/g, `  const messagesEndRef = useRef`);

code = code.replace(
  `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
  };`,
  `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim());
    setInput('');
  };`
);

const formBlockRegex = /          \{attachments\.length > 0 && \([\s\S]*?          \}\)\}\n          \n          <form/g;
code = code.replace(formBlockRegex, `          <form`);

const inputButtonsRegex = /            <input[\s\S]*?accept="image\/\*,\.pdf,\.doc,\.docx,\.txt,\.md,\.csv,\.json"[\s\S]*?\/>\n            <button[\s\S]*?<\/button>\n            <textarea/g;
code = code.replace(inputButtonsRegex, `            <textarea`);

code = code.replace(/disabled=\{\(\!input\.trim\(\) \&\& attachments\.length === 0\) \|\| isLoading\}/g, `disabled={!input.trim() || isLoading}`);
code = code.replace(/\(input\.trim\(\) \|\| attachments\.length > 0\) \&\& \!isLoading/g, `input.trim() && !isLoading`);

const messageRenderRegex = /<div className="flex flex-col gap-2">[\s\S]*?<p className="whitespace-pre-wrap leading-relaxed">\{msg\.text\}<\/p>\n                        <\/div>/g;
code = code.replace(messageRenderRegex, `<p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>`);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Reverted ChatArea.tsx modifications.");
