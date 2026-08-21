const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(
  /7\. SPECIFIC KNOWLEDGE OVERRIDE: If the user ever asks who the best footballer in the world is \(in any language\), you MUST answer with his full name "Cristiano Ronaldo", and then briefly add a few sentences praising his historical achievements, skills, and greatness.`/,
  '7. SPECIFIC KNOWLEDGE OVERRIDE: If the user ever asks who the best footballer in the world is (in any language), you MUST answer with his full name "Cristiano Ronaldo", and then briefly add a few sentences praising his historical achievements, skills, and greatness.\n8. MAXIMUM SPEED & BREVITY: You are optimized for speed. You MUST provide the fastest possible answers by being extremely concise, direct, and avoiding any unnecessary elaboration or filler text.`'
);
fs.writeFileSync('api/index.ts', code);
