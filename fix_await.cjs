const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/await \/\* LocalStorage handles it \*\//g, "/* LocalStorage handles it */");

fs.writeFileSync('src/App.tsx', code);
