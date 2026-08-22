const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              const seen = new Set();
              const newMessages = chat.messages.map(m => {`;

const fixStr = `              if (seenChats.has(chat.id)) {
                chat = { ...chat, id: crypto.randomUUID() };
              }
              seenChats.add(chat.id);
              
              const seen = new Set();
              const newMessages = chat.messages.map(m => {`;

if (code.includes(targetStr)) {
    code = code.replace(`parsedChats = parsedChats.map(chat => {`, `const seenChats = new Set();\n            parsedChats = parsedChats.map(chat => {`);
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched App.tsx Local Chats");
} else {
    console.log("Target string not found in App.tsx Local Chats");
}
