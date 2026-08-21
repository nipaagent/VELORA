const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /<UserAvatar name=\{userProfile\.fullName \|\| userProfile\.username\} avatarUrl=\{userProfile\.avatarUrl\} size="sm" \/>/g,
  '<UserAvatar name={userProfile.fullName || userProfile.username} avatarIndex={userProfile.avatarIndex || 0} avatarUrl={userProfile.avatarUrl} size="sm" />'
);
fs.writeFileSync('src/App.tsx', code);
