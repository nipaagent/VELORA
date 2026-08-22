const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const target = `        if (file.type.startsWith('image/')) {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'image',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        } else {
          // If it's a text file, try to read as text
          const textReader = new FileReader();
          textReader.onload = (e) => {
            const text = e.target?.result as string;
            if (text && typeof text === 'string' && !text.includes('data:')) {
              setKbContent(prev => prev ? prev + "\\n\\n" + text : text);
            } else {
               setKbAttachments(prev => [...prev, {
                id: crypto.randomUUID(),
                type: 'file',
                url: base64Url,
                name: file.name,
                mimeType: file.type
              }]);
            }
          };
          textReader.readAsText(file);
        }`;

const replacement = `        const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
        const isTextFile = textTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

        if (file.type.startsWith('image/')) {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'image',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        } else if (isTextFile) {
          const textReader = new FileReader();
          textReader.onload = (e) => {
            const text = e.target?.result as string;
            if (text && typeof text === 'string') {
              setKbContent(prev => prev ? prev + "\\n\\n" + text : text);
            }
          };
          textReader.readAsText(file);
        } else {
          setKbAttachments(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'file',
            url: base64Url,
            name: file.name,
            mimeType: file.type
          }]);
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
console.log("Successfully patched file upload logic");
