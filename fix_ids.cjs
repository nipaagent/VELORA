const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/Date\.now\(\)\.toString\(\)/g, "crypto.randomUUID()");
appCode = appCode.replace(/\(Date\.now\(\) \+ 1\)\.toString\(\)/g, "crypto.randomUUID()");

fs.writeFileSync('src/App.tsx', appCode);

let settingsCode = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');
settingsCode = settingsCode.replace(/const newId = Date\.now\(\)\.toString\(\);/g, "const newId = crypto.randomUUID();");
fs.writeFileSync('src/components/SettingsPage.tsx', settingsCode);
