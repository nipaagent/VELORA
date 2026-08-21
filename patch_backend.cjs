const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const s1 = "// Admin Users Endpoints";
const s2 = "// Fallback error middleware to ensure ALL responses are JSON";
let idx1 = code.indexOf(s1);
let idx2 = code.indexOf(s2);
if (idx1 !== -1 && idx2 !== -1) {
  code = code.substring(0, idx1) + code.substring(idx2);
}

fs.writeFileSync('api/index.ts', code);
