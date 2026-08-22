const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              setUserProfile(prof);
              localStorage.setItem(localProfileKey, JSON.stringify(prof));`;

const fixStr = `              // Fix any duplicated knowledgeBase IDs
              if (prof.knowledgeBases && Array.isArray(prof.knowledgeBases)) {
                const seenKb = new Set();
                prof.knowledgeBases = prof.knowledgeBases.map((kb: any) => {
                  if (seenKb.has(kb.id)) {
                    return { ...kb, id: crypto.randomUUID() };
                  }
                  seenKb.add(kb.id);
                  return kb;
                });
              }
              
              setUserProfile(prof);
              localStorage.setItem(localProfileKey, JSON.stringify(prof));`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched App.tsx KB");
} else {
    console.log("Target string not found in App.tsx KB");
}
