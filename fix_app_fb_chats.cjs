const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "// Subscribe to Firebase Realtime Database for chats";
const endMarker = `        } catch (e) {
          console.warn("DB chats access notice:", e);
          setAuthLoading(false);
        }`;
        
const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + `// Firebase chats sync removed. Relying entirely on localStorage.\n        setAuthLoading(false);` + code.substring(endIndex + endMarker.length);
    console.log("Removed Firebase chat sync");
} else {
    console.log("Could not find markers for Firebase chat sync");
}

// Now replace all set(ref(db, `chats/...` with empty or local logic
// We can just regex replace `set(ref(db, \`chats/.*?`), .*?);`
code = code.replace(/set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedWithUser\);/g, "/* LocalStorage handles it */");
code = code.replace(/set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), finalChat\)\.catch\(console\.warn\);/g, "/* LocalStorage handles it */");
code = code.replace(/if \(user\) set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedChat\)\.catch\(console\.warn\);/g, "/* LocalStorage handles it */");
code = code.replace(/await set\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{chatId\}\`\), updatedWithError\);/g, "/* LocalStorage handles it */");
code = code.replace(/await remove\(ref\(db, \`chats\/\$\{user\.uid\}\/\$\{id\}\`\)\);/g, "/* LocalStorage handles it */");
code = code.replace(/await remove\(ref\(db, \`chats\/\$\{user\.uid\}\`\)\);/g, "/* LocalStorage handles it */");
code = code.replace(/try {\n\s*\/\* LocalStorage handles it \*\/\n\s*\} catch \(err\) \{\n\s*console\.warn\("DB save error:", err\);\n\s*\}/g, "");
code = code.replace(/try {\n\s*\/\* LocalStorage handles it \*\/\n\s*\} catch \(e\) \{\n\s*console\.warn\("DB save error:", e\);\n\s*\}/g, "");

fs.writeFileSync('src/App.tsx', code);
