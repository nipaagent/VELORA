const fs = require('fs');

let chatArea = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
chatArea = chatArea.replace(
  /<UserAvatar name=\{userProfile\?\.fullName \|\| userProfile\?\.username \|\| 'User'\} size="sm" \/>/g,
  '<UserAvatar name={userProfile?.fullName || userProfile?.username || "User"} avatarIndex={userProfile?.avatarIndex || 0} size="sm" />'
);
fs.writeFileSync('src/components/ChatArea.tsx', chatArea);

let adminPage = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');
adminPage = adminPage.replace(
  /<UserAvatar name=\{user.fullName \|\| user.username\} avatarUrl=\{user.avatarUrl\} size="md" \/>/g,
  '<UserAvatar name={user.fullName || user.username} avatarIndex={user.avatarIndex || 0} avatarUrl={user.avatarUrl} size="md" />'
);
fs.writeFileSync('src/components/AdminPage.tsx', adminPage);

