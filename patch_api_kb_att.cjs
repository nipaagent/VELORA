const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const target1 = `    let knowledgeBase = req.body?.knowledgeBase;`;
const replacement1 = `    let knowledgeBase = req.body?.knowledgeBase;
    let knowledgeBaseAttachments = req.body?.knowledgeBaseAttachments;`;
code = code.replace(target1, replacement1);

const target2 = `    const formattedMessages = [
      { role: "system", content: systemPrompt },`;

const replacement2 = `
    let systemContent: any = systemPrompt;
    if (knowledgeBaseAttachments && knowledgeBaseAttachments.length > 0) {
      systemContent = [
        { type: "text", text: systemPrompt },
        ...knowledgeBaseAttachments.map((att: any) => ({
          type: "image_url",
          image_url: { url: att.url }
        }))
      ];
    }

    const formattedMessages = [
      { role: "system", content: systemContent },`;
code = code.replace(target2, replacement2);

fs.writeFileSync('api/index.ts', code);
console.log("Successfully patched api/index.ts for kb attachments");
