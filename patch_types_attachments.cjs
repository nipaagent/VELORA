const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const target1 = `export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thinking?: string;
  timestamp: number;
}`;

const replacement1 = `export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thinking?: string;
  timestamp: number;
  attachments?: Attachment[];
}`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync('src/types.ts', code);
  console.log("Successfully patched src/types.ts");
} else {
  console.log("Target not found in src/types.ts");
}
