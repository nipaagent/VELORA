const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const firebaseOnValueTarget = `              let chatsList: Chat[] = Object.values(data);
              // Fix any duplicated message IDs from older corrupted state
              chatsList = chatsList.map(chat => {
                if (!chat.messages) return chat;
                const seen = new Set();
                const newMessages = chat.messages.map(m => {
                  if (seen.has(m.id)) {
                    return { ...m, id: crypto.randomUUID() };
                  }
                  seen.add(m.id);
                  return m;
                });
                return { ...chat, messages: newMessages };
              });`;

const firebaseOnValueReplacement = `              let chatsList: Chat[] = Object.values(data);
              const seenChatsFB = new Set();
              chatsList = chatsList.map(chat => {
                let chatId = chat.id;
                if (!chatId || seenChatsFB.has(chatId)) {
                  chatId = crypto.randomUUID();
                }
                seenChatsFB.add(chatId);
                
                if (!chat.messages) return { ...chat, id: chatId };
                
                const seenMsgFB = new Set();
                const newMessages = chat.messages.map(m => {
                  let mId = m.id;
                  if (!mId || seenMsgFB.has(mId)) {
                    mId = crypto.randomUUID();
                  }
                  seenMsgFB.add(mId);
                  return { ...m, id: mId };
                });
                return { ...chat, id: chatId, messages: newMessages };
              });`;

code = code.replace(firebaseOnValueTarget, firebaseOnValueReplacement);

const localChatsTarget = `            const seenChats = new Set();
            parsedChats = parsedChats.map(chat => {
              if (seenChats.has(chat.id)) {
                chat = { ...chat, id: crypto.randomUUID() };
              }
              seenChats.add(chat.id);
              
              const seen = new Set();
              const newMessages = chat.messages.map(m => {
                if (seen.has(m.id)) {
                  return { ...m, id: crypto.randomUUID() };
                }
                seen.add(m.id);
                return m;
              });
              return { ...chat, messages: newMessages };
            });`;

const localChatsReplacement = `            const seenChatsLoc = new Set();
            parsedChats = parsedChats.map(chat => {
              let chatId = chat.id;
              if (!chatId || seenChatsLoc.has(chatId)) {
                chatId = crypto.randomUUID();
              }
              seenChatsLoc.add(chatId);
              
              if (!chat.messages) return { ...chat, id: chatId };
              
              const seenMsgLoc = new Set();
              const newMessages = chat.messages.map(m => {
                let mId = m.id;
                if (!mId || seenMsgLoc.has(mId)) {
                  mId = crypto.randomUUID();
                }
                seenMsgLoc.add(mId);
                return { ...m, id: mId };
              });
              return { ...chat, id: chatId, messages: newMessages };
            });`;

code = code.replace(localChatsTarget, localChatsReplacement);

const userProfileKbTarget = `              if (prof.knowledgeBases && Array.isArray(prof.knowledgeBases)) {
                const seenKb = new Set();
                prof.knowledgeBases = prof.knowledgeBases.map((kb: any) => {
                  if (seenKb.has(kb.id)) {
                    return { ...kb, id: crypto.randomUUID() };
                  }
                  seenKb.add(kb.id);
                  return kb;
                });
              }`;

const userProfileKbReplacement = `              if (prof.knowledgeBases && Array.isArray(prof.knowledgeBases)) {
                const seenKbFB = new Set();
                prof.knowledgeBases = prof.knowledgeBases.map((kb: any) => {
                  let kbId = kb.id;
                  if (!kbId || seenKbFB.has(kbId)) {
                    kbId = crypto.randomUUID();
                  }
                  seenKbFB.add(kbId);
                  return { ...kb, id: kbId };
                });
              }`;

code = code.replace(userProfileKbTarget, userProfileKbReplacement);

const localProfileKbTarget = `            if (parsedProfile.knowledgeBases && Array.isArray(parsedProfile.knowledgeBases)) {
              const seenKb = new Set();
              parsedProfile.knowledgeBases = parsedProfile.knowledgeBases.map((kb: any) => {
                if (seenKb.has(kb.id)) {
                  return { ...kb, id: crypto.randomUUID() };
                }
                seenKb.add(kb.id);
                return kb;
              });
            }`;

const localProfileKbReplacement = `            if (parsedProfile.knowledgeBases && Array.isArray(parsedProfile.knowledgeBases)) {
              const seenKbLoc = new Set();
              parsedProfile.knowledgeBases = parsedProfile.knowledgeBases.map((kb: any) => {
                let kbId = kb.id;
                if (!kbId || seenKbLoc.has(kbId)) {
                  kbId = crypto.randomUUID();
                }
                seenKbLoc.add(kbId);
                return { ...kb, id: kbId };
              });
            }`;

code = code.replace(localProfileKbTarget, localProfileKbReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx sanitization complete");
