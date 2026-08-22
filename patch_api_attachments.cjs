const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const target1 = `    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text || msg.content
      })),
      { role: "user", content: message }
    ];`;

const replacement1 = `    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => {
        let content = msg.text || msg.content || "";
        if (msg.attachments && msg.attachments.length > 0) {
          content = [
            { type: "text", text: msg.text || msg.content || "" },
            ...msg.attachments.map((att: any) => ({
              type: "image_url",
              image_url: { url: att.url }
            }))
          ];
        }
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: content
        };
      }),
      { 
        role: "user", 
        content: (req.body?.attachments && req.body.attachments.length > 0) ? [
          { type: "text", text: message },
          ...req.body.attachments.map((att: any) => ({
            type: "image_url",
            image_url: { url: att.url }
          }))
        ] : message
      }
    ];`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync('api/index.ts', code);
  console.log("Successfully patched api/index.ts");
} else {
  console.log("Target not found in api/index.ts");
}
