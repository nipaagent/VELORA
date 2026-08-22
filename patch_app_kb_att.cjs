const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          knowledgeBase: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content : undefined,
          userMemory: userProfile?.userMemory || undefined,`;

const replacement = `          knowledgeBase: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content : undefined,
          knowledgeBaseAttachments: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.attachments : undefined,
          userMemory: userProfile?.userMemory || undefined,`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Successfully patched src/App.tsx for kb attachments");
