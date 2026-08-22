const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "// Subscribe to Firebase Realtime Database for chats";
const endMarker = `        } catch (e) {
          console.warn("DB chats access notice (using local profile):", e);
          setAuthLoading(false);
        }`;
        
let startIndex = code.indexOf(startMarker);
if (startIndex !== -1) {
    const catchIndex = code.indexOf('setAuthLoading(false);', code.indexOf('catch', startIndex));
    const finalIndex = code.indexOf('}', catchIndex) + 1;
    code = code.substring(0, startIndex) + `// Firebase chats sync removed. Relying entirely on localStorage.\n        setAuthLoading(false);` + code.substring(finalIndex);
    console.log("Removed Firebase chat sync block");
} else {
    console.log("Could not find start marker");
}

code = code.replace(/set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedWithUser\);/g, "/* LocalStorage handles it */");
code = code.replace(/set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), finalChat\)\.catch\(console\.warn\);/g, "/* LocalStorage handles it */");
code = code.replace(/if \(user\) set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedChat\)\.catch\(console\.warn\);/g, "/* LocalStorage handles it */");
code = code.replace(/await set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedWithError\);/g, "/* LocalStorage handles it */");
code = code.replace(/await remove\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{id\}\`\)\);/g, "/* LocalStorage handles it */");
code = code.replace(/await remove\(ref\(db, \`chats\/\$\{user\.uid\}\`\)\);/g, "/* LocalStorage handles it */");

fs.writeFileSync('src/App.tsx', code);
