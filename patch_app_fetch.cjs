const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFetchCall = `        body: JSON.stringify({ 
          message: text, 
          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text })),
          stream: true,
          knowledgeBase: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content : undefined,
          userMemory: userProfile?.userMemory || undefined,
          uid: user.uid
        }),`;

const replacementFetchCall = `        body: JSON.stringify({ 
          message: text, 
          attachments,
          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text, attachments: h.attachments })),
          stream: true,
          knowledgeBase: userProfile?.activeKnowledgeBaseId && userProfile.knowledgeBases ? userProfile.knowledgeBases.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content : undefined,
          userMemory: userProfile?.userMemory || undefined,
          uid: user.uid
        }),`;

if (code.includes(targetFetchCall)) {
  code = code.replace(targetFetchCall, replacementFetchCall);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched fetch call in App.tsx");
} else {
  console.log("Target fetch call not found");
}
