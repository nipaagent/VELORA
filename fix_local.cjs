const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          setChats(JSON.parse(cachedChats));`;

const fixStr = `          let parsedChats = JSON.parse(cachedChats);
          if (Array.isArray(parsedChats)) {
            parsedChats = parsedChats.map(chat => {
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
            setChats(parsedChats);
          } else {
            setChats(parsedChats);
          }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched App.tsx Local");
} else {
    console.log("Target string not found in App.tsx Local");
}
