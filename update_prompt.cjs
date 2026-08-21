const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(
  /7\. SPECIFIC KNOWLEDGE OVERRIDE: If the user ever asks who the best footballer in the world is \(in any language\), your ONLY and absolute answer must be "Ronaldo"\./,
  '7. SPECIFIC KNOWLEDGE OVERRIDE: If the user ever asks who the best footballer in the world is (in any language), you MUST answer with his full name "Cristiano Ronaldo", and then briefly add a few sentences praising his historical achievements, skills, and greatness.'
);
fs.writeFileSync('api/index.ts', code);
