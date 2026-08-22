const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text })),\n          stream: true",
  "          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text })),\n          stream: true,\n          knowledgeBase: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content : undefined,\n          userMemory: userProfile?.userMemory || undefined,\n          uid: user.uid"
);

fs.writeFileSync('src/App.tsx', code);
