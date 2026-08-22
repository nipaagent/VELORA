const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Find start of attachments rendering
const startIndex = code.indexOf('{attachments.length > 0 && (');
if (startIndex !== -1) {
  // We know it ends around 30 lines later. Let's find the specific closing sequence before <form
  const formIndex = code.indexOf('<form', startIndex);
  if (formIndex !== -1) {
    // Remove the block
    code = code.substring(0, startIndex) + code.substring(formIndex);
  }
}

// Clean up unused state handlers if they are still there
code = code.replace(/  const removeAttachment = \([\s\S]*?\};\n\n/g, '');
code = code.replace(/  const formatFileSize = \([\s\S]*?\};\n\n/g, '');

fs.writeFileSync('src/components/ChatArea.tsx', code);
