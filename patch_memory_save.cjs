const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const injectPoint = 'const requestTokensSpent = Math.max(10, Math.round(((promptCharCount + responseCharCount) / 3.5) * globalTokenMultiplier));';

const memoryLogic = `
        const requestTokensSpent = Math.max(10, Math.round(((promptCharCount + responseCharCount) / 3.5) * globalTokenMultiplier));

        // Memory extraction logic
        const memoryMatch = fullResponse.match(/<SAVE_MEMORY>([\\s\\S]*?)<\\/SAVE_MEMORY>/);
        if (memoryMatch && memoryMatch[1] && userProfile && user) {
          const newFact = memoryMatch[1].trim();
          if (newFact) {
            const currentMemory = userProfile.userMemory || "";
            const updatedMemory = (currentMemory ? currentMemory + "\\n- " : "- ") + newFact;
            
            const updatedProfile = { ...userProfile, userMemory: updatedMemory };
            setUserProfile(updatedProfile);
            set(ref(db, \`users/\${user.uid}/userMemory\`), updatedMemory).catch(console.warn);
            
            // Clean up the message text in the final chat state
            setChats(prev => prev.map(c => {
              if (c.id === chatId) {
                const newMessages = c.messages.map(m => {
                  if (m.id === modelMessageId) {
                    return { ...m, text: m.text.replace(/<SAVE_MEMORY>[\\s\\S]*?(<\\/SAVE_MEMORY>)?/g, '').trim() };
                  }
                  return m;
                });
                return { ...c, messages: newMessages };
              }
              return c;
            }));
          }
        }
`;

code = code.replace(injectPoint, memoryLogic);
fs.writeFileSync('src/App.tsx', code);
