const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `        const defaultProfile: UserProfile = cachedProfile ? JSON.parse(cachedProfile) : {`;

const fixStr = `        let parsedProfile = null;
        if (cachedProfile) {
          try {
            parsedProfile = JSON.parse(cachedProfile);
            if (parsedProfile.knowledgeBases && Array.isArray(parsedProfile.knowledgeBases)) {
              const seenKb = new Set();
              parsedProfile.knowledgeBases = parsedProfile.knowledgeBases.map((kb: any) => {
                if (seenKb.has(kb.id)) {
                  return { ...kb, id: crypto.randomUUID() };
                }
                seenKb.add(kb.id);
                return kb;
              });
            }
          } catch (e) {}
        }
        
        const defaultProfile: UserProfile = parsedProfile ? parsedProfile : {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully patched App.tsx Local Profile");
} else {
    console.log("Target string not found in App.tsx Local Profile");
}
