const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const stateInjection = `
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [isSavingKb, setIsSavingKb] = useState(false);
  const [kbSuccess, setKbSuccess] = useState('');
  const [kbError, setKbError] = useState('');
  
  const handleSaveKb = async () => {
    if (!kbTitle.trim() || !kbContent.trim()) {
      setKbError('Title and content are required.');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser || !userProfile) return;
    setIsSavingKb(true);
    setKbError('');
    setKbSuccess('');
    
    try {
      const newId = Date.now().toString();
      const newKb = { id: newId, title: kbTitle.trim(), content: kbContent.trim(), createdAt: Date.now() };
      const updatedKbs = [...(userProfile.knowledgeBases || []), newKb];
      
      await update(ref(db, \`users/\${currentUser.uid}\`), {
        knowledgeBases: updatedKbs,
        activeKnowledgeBaseId: newId
      });
      
      const updatedProfile = { ...userProfile, knowledgeBases: updatedKbs, activeKnowledgeBaseId: newId };
      onUpdateProfile(updatedProfile);
      setKbTitle('');
      setKbContent('');
      setKbSuccess('Data saved and set as active!');
      setTimeout(() => setKbSuccess(''), 3000);
    } catch (e: any) {
      setKbError(e.message || 'Failed to save data');
    } finally {
      setIsSavingKb(false);
    }
  };

  const handleDeleteKb = async (id: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userProfile) return;
    
    const updatedKbs = (userProfile.knowledgeBases || []).filter(k => k.id !== id);
    let newActiveId = userProfile.activeKnowledgeBaseId;
    if (newActiveId === id) {
      newActiveId = updatedKbs.length > 0 ? updatedKbs[0].id : '';
    }
    
    try {
      await update(ref(db, \`users/\${currentUser.uid}\`), {
        knowledgeBases: updatedKbs,
        activeKnowledgeBaseId: newActiveId || null
      });
      onUpdateProfile({ ...userProfile, knowledgeBases: updatedKbs, activeKnowledgeBaseId: newActiveId });
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleSetActiveKb = async (id: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userProfile) return;
    try {
      await update(ref(db, \`users/\${currentUser.uid}\`), {
        activeKnowledgeBaseId: id
      });
      onUpdateProfile({ ...userProfile, activeKnowledgeBaseId: id });
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleClearMemory = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userProfile) return;
    try {
      await update(ref(db, \`users/\${currentUser.uid}\`), {
        userMemory: null
      });
      onUpdateProfile({ ...userProfile, userMemory: undefined });
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace(
  "  const [redeemSuccess, setRedeemSuccess] = useState('');",
  "  const [redeemSuccess, setRedeemSuccess] = useState('');\n" + stateInjection
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
