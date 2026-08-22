const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              const data = snapshot.val();
              const chatsList: Chat[] = Object.values(data);
              chatsList.sort((a, b) => b.updatedAt - a.updatedAt);`;

const fixStr = `              const data = snapshot.val();
              let chatsList: Chat[] = Object.values(data);
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
              });
              chatsList.sort((a, b) => b.updatedAt - a.updatedAt);`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched App.tsx");
} else {
    console.log("Target string not found in App.tsx");
}
