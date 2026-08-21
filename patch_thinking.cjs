const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(
  /2\. MANDATORY THINKING TAGS:[\s\S]*?3\. LANGUAGE:/,
  '2. NO THINKING TAGS FOR SPEED: To ensure the fastest possible response, DO NOT output <thinking> tags or internal thoughts unless absolutely necessary for complex coding tasks. For 99% of queries, just answer directly immediately.\n3. LANGUAGE:'
);
fs.writeFileSync('api/index.ts', code);
