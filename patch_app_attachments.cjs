const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update ChatArea onSendMessage prop usage
const oldSendSignature = `  const sendMessage = async (text: string) => {`;
const newSendSignature = `  const sendMessage = async (text: string, attachments?: any[]) => {`;
code = code.replace(oldSendSignature, newSendSignature);

const oldProcessCall = `    await processMessage(activeChatId, text, targetChat);`;
const newProcessCall = `    await processMessage(activeChatId, text, targetChat, attachments);`;
code = code.replace(oldProcessCall, newProcessCall);

const oldProcessSignature = `  const processMessage = async (chatId: string, text: string, currentChatState: Chat) => {`;
const newProcessSignature = `  const processMessage = async (chatId: string, text: string, currentChatState: Chat, attachments?: any[]) => {`;
code = code.replace(oldProcessSignature, newProcessSignature);

const oldUserMessage = `    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };`;
const newUserMessage = `    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
      attachments,
    };`;
code = code.replace(oldUserMessage, newUserMessage);

const oldFetchCall = `        body: JSON.stringify({ 
          message: text, 
          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text })),
          model: selectedModel,
          knowledgeBase: userProfile?.activeKnowledgeBaseId 
            ? userProfile.knowledgeBases?.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content
            : undefined,
          userMemory: userProfile?.userMemory
        })
      });`;

const newFetchCall = `        body: JSON.stringify({ 
          message: text, 
          attachments,
          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text, attachments: h.attachments })),
          model: selectedModel,
          knowledgeBase: userProfile?.activeKnowledgeBaseId 
            ? userProfile.knowledgeBases?.find(k => k.id === userProfile.activeKnowledgeBaseId)?.content
            : undefined,
          userMemory: userProfile?.userMemory
        })
      });`;
code = code.replace(oldFetchCall, newFetchCall);

fs.writeFileSync('src/App.tsx', code);
console.log("Successfully patched src/App.tsx");
