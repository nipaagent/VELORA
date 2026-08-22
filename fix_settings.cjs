const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const exportTarget = `      const snapshot = await get(ref(db, \`chats/\${user.uid}\`));
      if (snapshot.exists()) {
        const data = snapshot.val();`;

const exportReplacement = `      const localChats = localStorage.getItem(\`velora-chats-\${user.uid}\`);
      if (localChats) {
        const data = JSON.parse(localChats);`;

code = code.replace(exportTarget, exportReplacement);

const importTarget = `        if (Array.isArray(data)) {
          data.forEach((chat: any) => {
            if (chat && chat.id) {
              processedData[chat.id] = chat;
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          processedData = data;
        } else {
          throw new Error("Invalid format");
        }

        await update(ref(db, \`chats/\${user.uid}\`), processedData);`;

const importReplacement = `        let finalChats = [];
        if (Array.isArray(data)) {
          finalChats = data;
        } else if (typeof data === 'object' && data !== null) {
          finalChats = Object.values(data);
        } else {
          throw new Error("Invalid format");
        }
        
        // Merge with existing local chats
        const existingStr = localStorage.getItem(\`velora-chats-\${user.uid}\`);
        let existingChats = existingStr ? JSON.parse(existingStr) : [];
        if (!Array.isArray(existingChats)) existingChats = Object.values(existingChats);
        
        const mergedChats = [...finalChats, ...existingChats];
        const uniqueChats = [];
        const seenIds = new Set();
        for (const c of mergedChats) {
           if (c && c.id && !seenIds.has(c.id)) {
              seenIds.add(c.id);
              uniqueChats.push(c);
           }
        }
        
        uniqueChats.sort((a, b) => b.updatedAt - a.updatedAt);
        localStorage.setItem(\`velora-chats-\${user.uid}\`, JSON.stringify(uniqueChats));`;

code = code.replace(importTarget, importReplacement);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
console.log("SettingsPage.tsx updated successfully");
