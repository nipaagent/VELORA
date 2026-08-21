const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(/6\. PERSONA conversational filler\.\` HELPFULNESS/g, '6. PERSONA & HELPFULNESS');
fs.writeFileSync('api/index.ts', code);
