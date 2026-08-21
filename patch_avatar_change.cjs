const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// Add handleAvatarSelect
const handleAvatarSelectFunc = `
  const handleAvatarSelect = async (idx: number) => {
    setSelectedAvatarIndex(idx);
    if (!userProfile) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await update(ref(db, \`users/\${currentUser.uid}\`), {
        avatarIndex: idx
      });
      const updatedProfile: UserProfile = {
        ...userProfile,
        avatarIndex: idx,
      };
      localStorage.setItem(\`velora-profile-\${currentUser.uid}\`, JSON.stringify(updatedProfile));
      onUpdateProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update avatar index', error);
    }
  };
`;

if (!code.includes('handleAvatarSelect')) {
  code = code.replace(
    "const handleSaveName = async (e: React.FormEvent) => {",
    handleAvatarSelectFunc + "\n  const handleSaveName = async (e: React.FormEvent) => {"
  );
}

// Update the onClick
code = code.replace(
  "onClick={() => setSelectedAvatarIndex(idx)}",
  "onClick={() => handleAvatarSelect(idx)}"
);

// We should also remove avatarIndex from handleSaveName since it's already handled, or leave it, it's fine either way, but better to remove so we don't accidentally revert to an old state if selectedAvatarIndex is somehow stale (though it shouldn't be).
code = code.replace(
  "avatarIndex: selectedAvatarIndex",
  "// avatarIndex: selectedAvatarIndex"
);
code = code.replace(
  "avatarIndex: selectedAvatarIndex,",
  "// avatarIndex: selectedAvatarIndex,"
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
