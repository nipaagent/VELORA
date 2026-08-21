const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');
code = code.replace(
  "setSelectedAvatarIndex(userProfile.avatarIndex);\n    }\n    }\n  }, [userProfile]);",
  "setSelectedAvatarIndex(userProfile.avatarIndex);\n    }\n  }, [userProfile]);"
);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
