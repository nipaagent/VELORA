import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Eye, EyeOff, Check, X, 
  ShieldAlert, RefreshCw, KeyRound, ArrowLeft, Save, Sparkles, AlertCircle, ShieldCheck,
  Ban, UserCheck, ShieldX, CheckCircle2, AlertTriangle, Lock, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { generateUniqueVeloraKey } from '../lib/utils';

interface AdminUser {
  uid: string;
  fullName: string;
  username: string;
  password?: string;
  createdAt?: number;
  role?: string;
  status?: 'approved' | 'pending' | 'banned';
  isBanned?: boolean;
  apiAccessEnabled?: boolean;
  apiKey?: string;
}

interface AdminPageProps {
  onBackToChat?: () => void;
}

export default function AdminPage({ onBackToChat }: AdminPageProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyCount, setApiKeyCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Visibility toggles for user passwords
  const [visiblePasswords, setVisiblePasswords] = useState<{ [uid: string]: boolean }>({});
  
  // Edit Modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'banned'>('approved');
  const [editApiAccessEnabled, setEditApiAccessEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add New User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newStatus, setNewStatus] = useState<'approved' | 'pending' | 'banned'>('approved');

  // Toast alert feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 100% Pure Real-time & API synchronization with Firebase Database `users/`
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        }
      });

      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        // Direct SDK fallback
        const usersRef = ref(db, 'users');
        onValue(usersRef, (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const firebaseList: AdminUser[] = Object.keys(val).map((key) => ({
              uid: key,
              fullName: val[key].fullName || 'No Name',
              username: val[key].username || key,
              password: val[key].password || '',
              createdAt: val[key].createdAt || Date.now(),
              role: val[key].role || (val[key].username === 'admin' ? 'admin' : 'user'),
              status: val[key].status || (val[key].isBanned ? 'banned' : 'approved'),
              isBanned: !!val[key].isBanned || val[key].status === 'banned'
            }));
            firebaseList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setUsers(firebaseList);
          }
        }, { onlyOnce: true });
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      showToast("ইউজার লোড করতে সমস্যা হয়েছে: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.status === 'success') {
        setApiKeyCount(data.apiKeyCount);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();

    try {
      const usersRef = ref(db, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const firebaseList: AdminUser[] = Object.keys(val).map((key) => ({
            uid: key,
            fullName: val[key].fullName || 'No Name',
            username: val[key].username || key,
            password: val[key].password || '',
            createdAt: val[key].createdAt || Date.now(),
            role: val[key].role || (val[key].username === 'admin' ? 'admin' : 'user'),
            status: val[key].status || (val[key].isBanned ? 'banned' : 'approved'),
            isBanned: !!val[key].isBanned || val[key].status === 'banned'
          }));
          firebaseList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setUsers(firebaseList);
        }
      }, (error) => {
        console.warn("RTDB WebSocket Notice (handled via API):", error.message);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("RTDB listener notice:", e);
    }
  }, []);

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditRole((user.role as any) || 'user');
    setEditStatus(user.status || (user.isBanned ? 'banned' : 'approved'));
    setEditApiAccessEnabled(!!user.apiAccessEnabled);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editUsername.trim() || !editPassword.trim()) {
      showToast("সবগুলো ঘর পূরণ করুন!", "error");
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    setIsSaving(true);

    try {
      // 1. Direct Firebase Realtime DB update
      await update(ref(db, `users/${editingUser.uid}`), {
        fullName: editName.trim(),
        username: cleanUsername,
        password: editPassword.trim(),
        updatedAt: Date.now()
      });

      // 2. Server API sync
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      await fetch(`/api/admin/users/${editingUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        },
        body: JSON.stringify({
          fullName: editName.trim(),
          username: cleanUsername,
          password: editPassword.trim(),
          oldUsername: editingUser.username
        })
      });

      showToast("ইউজার তথ্য আপডেট করা হয়েছে।");
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      console.error("Firebase update error:", err);
      showToast(`ফায়ারবেস আপডেট করতে সমস্যা হয়েছে: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    const isCurrentlyBanned = user.status === 'banned' || user.isBanned;
    const newStatus = isCurrentlyBanned ? 'approved' : 'banned';
    const actionText = isCurrentlyBanned ? 'আনব্যান/অ্যাপ্রুভ' : 'ব্যান';

    if (window.confirm(`আপনি কি নিশ্চিত যে '${user.fullName}' (@${user.username}) ইউজারকে ${actionText} করতে চান?`)) {
      try {
        // Direct Firebase Realtime DB update
        await update(ref(db, `users/${user.uid}`), {
          status: newStatus,
          isBanned: !isCurrentlyBanned,
          updatedAt: Date.now()
        });

        // Server API update
        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : '';

        await fetch(`/api/admin/users/${user.uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken ? `Bearer ${idToken}` : ''
          },
          body: JSON.stringify({
            fullName: user.fullName,
            username: user.username,
            password: user.password || '',
            role: user.role || 'user',
            status: newStatus,
            isBanned: !isCurrentlyBanned
          })
        });

        showToast(`ইউজার ${isCurrentlyBanned ? 'আনব্যান' : 'ব্যান'} করা হয়েছে!`);
        await fetchUsers();
      } catch (err: any) {
        console.error("Ban toggle error:", err);
        showToast(`সমস্যা হয়েছে: ${err.message}`, "error");
      }
    }
  };

  const handleToggleApiAccess = async (user: AdminUser) => {
    const newVal = !user.apiAccessEnabled;
    try {
      await update(ref(db, `users/${user.uid}`), {
        apiAccessEnabled: newVal,
        updatedAt: Date.now()
      });
      showToast(`API Access ${newVal ? 'Enabled' : 'Disabled'}!`);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await update(ref(db, `users/${user.uid}`), {
        role: newRole,
        updatedAt: Date.now()
      });
      showToast(`Role changed to ${newRole.toUpperCase()}!`);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRegenerateUserKey = async (user: AdminUser) => {
    if (window.confirm(`Are you sure you want to REGENERATE a new API key for '${user.fullName}'? The old key will stop working immediately.`)) {
      try {
        const newKey = generateUniqueVeloraKey();
        await update(ref(db, `users/${user.uid}`), {
          apiKey: newKey,
          keyCreatedAt: Date.now(),
          updatedAt: Date.now()
        });
        showToast("New API key generated successfully!");
        await fetchUsers();
        alert(`New API key has been generated successfully.`);
      } catch (err: any) {
        showToast(err.message, "error");
      }
    }
  };

  const handleRevokeUserKey = async (user: AdminUser) => {
    if (window.confirm(`Are you sure you want to REVOKE and DELETE the API key for '${user.fullName}'?`)) {
      try {
        await update(ref(db, `users/${user.uid}`), {
          apiKey: '',
          keyCreatedAt: null,
          updatedAt: Date.now()
        });
        showToast("API key revoked and deleted!");
        await fetchUsers();
        alert(`API key has been revoked and deleted.`);
      } catch (err: any) {
        showToast(err.message, "error");
      }
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে '${user.fullName}' (@${user.username}) ইউজারকে ফায়ারবেস থেকে সম্পূর্ণ ডিলিট করতে চান?`)) {
      try {
        await remove(ref(db, `users/${user.uid}`));
        if (user.username) {
          await remove(ref(db, `usernames/${user.username}`));
        }

        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : '';

        await fetch(`/api/admin/users/${user.uid}?username=${encodeURIComponent(user.username)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': idToken ? `Bearer ${idToken}` : ''
          }
        });

        showToast("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে!");
        await fetchUsers();
      } catch (err: any) {
        console.error("Firebase deletion error:", err);
        showToast(`ফায়ারবেস থেকে ডিলিট করতে সমস্যা হয়েছে: ${err.message}`, "error");
      }
    }
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      showToast("সকল তথ্য প্রদান করুন", "error");
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const generatedUid = `user_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    setIsSaving(true);

    const newUserObj = {
      uid: generatedUid,
      fullName: newName.trim(),
      username: cleanUsername,
      password: newPassword.trim(),
      createdAt: Date.now(),
      role: newRole,
      status: newStatus,
      isBanned: newStatus === 'banned'
    };

    try {
      // Direct Firebase RTDB write
      await set(ref(db, `users/${generatedUid}`), newUserObj);
      await set(ref(db, `usernames/${cleanUsername}`), generatedUid);

      // Server API sync
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        },
        body: JSON.stringify({
          fullName: newName.trim(),
          username: cleanUsername,
          password: newPassword.trim(),
          role: newRole,
          status: newStatus
        })
      });

      showToast("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে!");
      setIsAddModalOpen(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      await fetchUsers();
    } catch (err: any) {
      console.error("Firebase creation error:", err);
      showToast(`ফায়ারবেসে নতুন ইউজার তৈরিতে সমস্যা: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDefaultUsers = async () => {
    setIsSaving(true);
    try {
      const defaultUsers = [
        {
          uid: 'admin_master',
          fullName: 'Velora Administrator',
          username: 'admin',
          password: 'adminpassword',
          createdAt: Date.now() - 100000,
          role: 'admin',
          status: 'approved',
          isBanned: false
        },
        {
          uid: 'user_demo_1',
          fullName: 'Alex River',
          username: 'alex_river',
          password: 'user12345',
          createdAt: Date.now() - 50000,
          role: 'user',
          status: 'approved',
          isBanned: false
        },
        {
          uid: 'user_demo_2',
          fullName: 'Sonia Rahaman',
          username: 'sonia_r',
          password: 'user12345',
          createdAt: Date.now() - 20000,
          role: 'user',
          status: 'approved',
          isBanned: false
        }
      ];

      for (const u of defaultUsers) {
        await set(ref(db, `users/${u.uid}`), u);
        await set(ref(db, `usernames/${u.username}`), u.uid);
      }

      showToast("ডিফল্ট ইউজারসমূহ ফায়ারবেসে সফলভাবে সিড করা হয়েছে!");
      await fetchUsers();
    } catch (err: any) {
      console.error("Seed error:", err);
      showToast(`সিড করতে সমস্যা: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50/80 p-3 sm:p-4 md:p-6 text-slate-800">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
          toastMessage.type === 'success' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' : 'bg-red-900 text-red-100 border border-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3">

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 bg-white/50 backdrop-blur-md p-3 rounded-lg shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                সিস্টেম অ্যাডমিনিস্ট্রেটর প্যানেল / ADMIN PORTAL
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2 mt-0.5">
                VELORA REALTIME ADMIN CONTROL
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-2xs uppercase">
              <KeyRound className="w-3 h-3" />
              <span>API Keys: {apiKeyCount}</span>
            </span>

            <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Users className="w-3.5 h-3.5" />
              <span>মোট ইউজার: {users.length} জন</span>
            </span>

            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>চ্যাটে ফিরুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ইউজারনেম বা নাম বা আইডি দিয়ে সার্চ করুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন ইউজার তৈরি করুন</span>
          </button>
        </div>

        {/* Users List Container */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              রেজিস্টার্ড ইউজার তালিকা (Users List)
            </h3>
            {loading && (
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>লোডিং...</span>
              </div>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-[11px] font-medium space-y-2">
              <p>{searchTerm ? 'কোনো ইউজার পাওয়া যায়নি।' : 'এখনো কোনো ইউজার নেই।'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {filteredUsers.map((user, idx) => {
                  const isBanned = user.status === 'banned' || user.isBanned;

                  return (
                    <motion.div 
                      key={user.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                      className={`p-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBanned ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* User Details */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {user.fullName}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono">
                            @{user.username}
                          </span>

                        {user.role === 'admin' && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> ADMIN
                          </span>
                        )}

                        {/* Status Badge */}
                        {isBanned ? (
                          <span className="text-[10px] font-black text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Ban className="w-3 h-3 text-red-600" /> BANNED (ব্যানড)
                          </span>
                        ) : user.status === 'pending' ? (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> PENDING
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-slate-600 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400 text-[10px]">পাসওয়ার্ড:</span>
                          <span className="font-bold text-slate-800">
                            {visiblePasswords[user.uid] ? (user.password || 'N/A') : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.uid)}
                            className="ml-1 text-slate-400 hover:text-slate-700 p-0.5"
                            title={visiblePasswords[user.uid] ? "Hide Password" : "Show Password"}
                          >
                            {visiblePasswords[user.uid] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-400 font-sans">
                          UID: <span className="font-mono text-slate-600">{user.uid}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      
                      {/* API Access Toggle Button */}
                      <button
                        onClick={() => handleToggleApiAccess(user)}
                        className={`p-2 rounded-lg border transition-all ${
                          user.apiAccessEnabled 
                            ? 'bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={user.apiAccessEnabled ? "API Access: Enabled" : "API Access: Disabled"}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Admin Toggle Button */}
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`p-2 rounded-lg border transition-all ${
                          user.role === 'admin'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={user.role === 'admin' ? "Role: Admin" : "Role: User"}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>

                      {/* Ban / Approve Button */}
                      <button
                        onClick={() => handleToggleBan(user)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold text-[10px] transition-all shadow-2xs ${
                          isBanned
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600'
                        }`}
                        title={isBanned ? "আনব্যান করুন" : "ব্যান করুন"}
                      >
                        {isBanned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        <span>{isBanned ? 'আনব্যান' : 'ব্যান'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                        title="এডিট"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors shadow-2xs"
                        title="ডিলিট"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                ইউজার তথ্য পরিবর্তন (Edit User Profile)
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">ফুল নাম (Full Name)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">ইউজারনেম / ID (Username)</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">পাসওয়ার্ড (Password)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                বাতিল (Cancel)
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>সেভ করুন (Save Changes)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                নতুন ইউজার যোগ করুন (Add New User)
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">ফুল নাম (Full Name)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Hasan"
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">ইউজারনেম (Username)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. rahul_99"
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">পাসওয়ার্ড (Password)</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">রোল (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="user">User (সাধারণ ইউজার)</option>
                    <option value="admin">Admin (অ্যাডমিন)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">স্ট্যাটাস (Status)</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="approved">Approved (অ্যাপ্রুভড)</option>
                    <option value="pending">Pending (পেন্ডিং)</option>
                    <option value="banned">Banned (ব্যানড)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                বাতিল (Cancel)
              </button>

              <button
                onClick={handleCreateUser}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>ইউজার সেভ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
