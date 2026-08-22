const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const target = `knowledgeBases?: { id: string; title: string; content: string; createdAt: number; }[];`;
const replacement = `knowledgeBases?: { id: string; title: string; content: string; createdAt: number; attachments?: Attachment[]; }[];`;

code = code.replace(target, replacement);
fs.writeFileSync('src/types.ts', code);
console.log("Successfully patched types.ts");
