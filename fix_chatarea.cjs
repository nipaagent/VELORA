const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Also remove Attachment from ChatAreaProps
code = code.replace(/onSendMessage: \(text: string, attachments\?: Attachment\[\]\) => void;/, "onSendMessage: (text: string) => void;");

// Remove Attachment from imports if unused elsewhere, but it might be used in Chat type, so just leave import. Wait, the import was changed:
code = code.replace(/import \{ Chat, UserProfile, Attachment \} from '\.\.\/types';/, "import { Chat, UserProfile } from '../types';");

const attachmentsBlockRegex = /          \{attachments\.length > 0 && \([\s\S]*?          \}\)\}\n          \n/g;
code = code.replace(attachmentsBlockRegex, '');

fs.writeFileSync('src/components/ChatArea.tsx', code);
