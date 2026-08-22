const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

const target1 = `  onSendMessage: (text: string) => void;`;
const replacement1 = `  onSendMessage: (text: string, attachments?: any[]) => void;`;
code = code.replace(target1, replacement1);

const iconTarget = `import { Bot, User, Loader2, Send, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';`;
const iconReplacement = `import { Bot, User, Loader2, Send, BrainCircuit, ChevronDown, ChevronUp, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';`;
code = code.replace(iconTarget, iconReplacement);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log("Successfully patched ChatArea.tsx props and imports");
