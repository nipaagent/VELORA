const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  adsWatchedCount?: number;",
  "  adsWatchedCount?: number;\n  knowledgeBases?: { id: string; title: string; content: string; createdAt: number; }[];\n  activeKnowledgeBaseId?: string;\n  userMemory?: string;"
);

fs.writeFileSync('src/types.ts', code);
