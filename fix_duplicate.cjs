const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');
code = code.replace(
  "fullName: fullName.trim(),\n        avatarIndex: selectedAvatarIndex,\n        avatarIndex: selectedAvatarIndex",
  "fullName: fullName.trim(),\n        avatarIndex: selectedAvatarIndex"
);
// Also ensure `avatarIndex: selectedAvatarIndex` is added to `updatedProfile`!
code = code.replace(
  "const updatedProfile: UserProfile = {\n        ...userProfile,\n        fullName: fullName.trim(),\n      };",
  "const updatedProfile: UserProfile = {\n        ...userProfile,\n        fullName: fullName.trim(),\n        avatarIndex: selectedAvatarIndex,\n      };"
);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
