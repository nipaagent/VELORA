import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, set, remove, update, push, get } from 'firebase/database';
import { AdminHeader } from './admin/AdminHeader';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminBroadcastTab } from './admin/AdminBroadcastTab';
import { AdminTokenConfigTab } from './admin/AdminTokenConfigTab';
import { AdminRedeemTab } from './admin/AdminRedeemTab';
import { AdminSecurityTab } from './admin/AdminSecurityTab';
import { AdminApiKeysTab } from './admin/AdminApiKeysTab';
import { AdminLogsTab } from './admin/AdminLogsTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { AdminUserTokenModal } from './admin/AdminUserTokenModal';
import { AdminUserEditModal } from './admin/AdminUserEditModal';
import { AdminAddUserModal } from './admin/AdminAddUserModal';
import VipUserModal from './VipUserModal';
import { AdminUser, AdminLog, ApiKeyDetail } from './admin/adminTypes';
import { SystemAnnouncement, SystemControl, RedeemCode } from '../types';
import { generateUniqueVeloraKey } from '../lib/utils';

interface AdminPageProps {
  onBackToChat?: () => void;
}

export default function AdminPage({ onBackToChat }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'broadcast' | 'tokens' | 'redeem' | 'security' | 'apikeys' | 'logs'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adLinks, setAdLinks] = useState<string[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  
  const [tokenConfig, setTokenConfig] = useState({
    adRewardTokenAmount: 30000,
    defaultMaxDailyTokens: 50000,
    tokenMultiplier: 1
  });

  const [announcement, setAnnouncement] = useState<SystemAnnouncement>({
    isActive: false,
    title: '',
    message: '',
    type: 'info',
    linkUrl: '',
    linkText: '',
    updatedAt: Date.now()
  });

  const [systemControl, setSystemControl] = useState<SystemControl>({
    maintenanceMode: false,
    maintenanceNotice: 'সার্ভার রক্ষণাবেক্ষণের কাজ চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।',
    allowRegistration: true,
    aiChatEnabled: true,
    adRewardsEnabled: true
  });

  // Modal States
  const [selectedUserForToken, setSelectedUserForToken] = useState<AdminUser | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null);
  const [selectedUserForVip, setSelectedUserForVip] = useState<AdminUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // API Keys status mock/realtime
  const [apiKeys, setApiKeys] = useState<ApiKeyDetail[]>([
    {
      name: 'NIPA API Gateway (Primary)',
      maskedValue: 'nipa-••••••••••••••••••••••••3L1Q',
      status: 'Active',
      todayCalls: 1420,
      totalCalls: 48930,
      successCalls: 48890,
      errorCalls: 40
    }
  ]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);

  const fetchApiKeysStats = async () => {
    setIsLoadingApiKeys(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
          setApiKeys(data.keys);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch admin stats:", e);
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  useEffect(() => {
    fetchApiKeysStats();
  }, []);

  // Push audit log helper
  const logAdminAction = async (action: string, description: string) => {
    try {
      const logsRef = ref(db, 'admin_logs');
      await push(logsRef, {
        action,
        description,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Failed to write audit log:", e);
    }
  };

  // 1. Listen to Users from Firebase RTDB
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUsers([]);
        return;
      }
      const data = snapshot.val();
      const list: AdminUser[] = Object.keys(data).map((uid) => ({
        uid,
        ...data[uid]
      }));
      // Sort newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(list);
    });

    // 3. Listen to Redeem Codes
    const redeemRef = ref(db, 'redeem_codes');
    const unsubscribeRedeem = onValue(redeemRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRedeemCodes([]);
        return;
      }
      const data = snapshot.val();
      const list: RedeemCode[] = Object.keys(data).map(k => ({
        id: k,
        ...data[k]
      }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRedeemCodes(list);
    });

    // 4. Listen to Token Config
    const tokenConfigRef = ref(db, 'settings/token_config');
    const unsubscribeConfig = onValue(tokenConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        setTokenConfig(snapshot.val());
      }
    });

    // 5. Listen to Announcement
    const announceRef = ref(db, 'settings/system_announcement');
    const unsubscribeAnnounce = onValue(announceRef, (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.val());
      }
    });

    // 6. Listen to System Control
    const controlRef = ref(db, 'settings/system_control');
    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      if (snapshot.exists()) {
        setSystemControl(snapshot.val());
      }
    });

    // 7. Listen to Admin Logs
    const logsRef = ref(db, 'admin_logs');
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAdminLogs([]);
        return;
      }
      const data = snapshot.val();
      const list: AdminLog[] = Object.keys(data).map(k => ({
        id: k,
        ...data[k]
      }));
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setAdminLogs(list);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRedeem();
      unsubscribeConfig();
      unsubscribeAnnounce();
      unsubscribeControl();
      unsubscribeLogs();
    };
  }, []);

  // Handler: Save System Announcement
  const handleSaveAnnouncement = async (data: SystemAnnouncement) => {
    setIsSaving(true);
    try {
      await set(ref(db, 'settings/system_announcement'), data);
      await logAdminAction(
        data.isActive ? 'BROADCAST_PUBLISHED' : 'BROADCAST_DISABLED',
        `গ্লোবাল ব্রডকাস্ট নোটিশ আপডেট করা হয়েছে: "${data.title || 'Untitled'}"`
      );
    } catch (e: any) {
      alert("ব্রডকাস্ট সংরক্ষণ ব্যর্থ হয়েছে: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Save System Control
  const handleUpdateSystemControl = async (ctrl: SystemControl) => {
    setIsSaving(true);
    try {
      await set(ref(db, 'settings/system_control'), ctrl);
      await logAdminAction(
        'SYSTEM_CONTROL_UPDATED',
        `সিস্টেম সুইচ আপডেট: মেইনটেন্যান্স=${ctrl.maintenanceMode ? 'ON' : 'OFF'}, রেজিস্ট্রেশন=${ctrl.allowRegistration ? 'ON' : 'OFF'}`
      );
    } catch (e: any) {
      alert("সিস্টেম কন্ট্রোল আপডেট ব্যর্থ হয়েছে: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Save Global Token Config
  const handleSaveTokenConfig = async (cfg: any) => {
    setIsSaving(true);
    try {
      await set(ref(db, 'settings/token_config'), cfg);
      await logAdminAction(
        'TOKEN_CONFIG_UPDATED',
        `টোকেন সেটিং আপডেট: ডেইলি=${cfg.defaultMaxDailyTokens}, এড=${cfg.adRewardTokenAmount}`
      );
    } catch (e: any) {
      alert("টোকেন কনফিগ সংরক্ষণ ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Atomic Batch Update All Users Token Limit
  const handleBatchUpdateAllUsersLimit = async (newLimit: number) => {
    const updates: Record<string, any> = {};
    users.forEach(u => {
      updates[`users/${u.uid}/tokenState/maxDailyTokens`] = newLimit;
    });
    await update(ref(db), updates);
    await logAdminAction(
      'BATCH_TOKEN_LIMIT_UPDATED',
      `সকল (${users.length}) ইউজারের ডেইলি ফ্রি লিমিট ${newLimit}-এ আপডেট করা হয়েছে`
    );
  };

  // Handler: Add / Delete Ad Link
  const handleAddAdLink = async (link: string) => {
    const updated = [...adLinks, link];
    await set(ref(db, 'settings/ad_links'), updated);
    await logAdminAction('AD_LINK_ADDED', `নতুন স্পনসর অ্যাড লিংক যোগ করা হয়েছে: ${link}`);
  };

  const handleDeleteAdLink = async (link: string) => {
    const updated = adLinks.filter(l => l !== link);
    await set(ref(db, 'settings/ad_links'), updated);
    await logAdminAction('AD_LINK_DELETED', `অ্যাড লিংক মুছে ফেলা হয়েছে`);
  };

  // Handler: Create Redeem Code
  const handleCreateRedeemCode = async (codeData: Omit<RedeemCode, 'id' | 'usedCount' | 'usedBy'>) => {
    setIsSaving(true);
    try {
      const codeRef = ref(db, `redeem_codes/${codeData.code}`);
      const snap = await get(codeRef);
      if (snap.exists()) {
        alert("এই কোডটি ইতিমধ্যে বিদ্যমান! অন্য কোড টেক্সট ব্যবহার করুন।");
        return;
      }
      await set(codeRef, {
        ...codeData,
        usedCount: 0
      });
      await logAdminAction(
        'REDEEM_CODE_CREATED',
        `নতুন রিডিম কোড তৈরি করা হয়েছে: ${codeData.code} (${codeData.rewardType === 'tokens' ? codeData.tokenAmount + ' টোকেন' : codeData.vipDays + ' দিন VIP'})`
      );
      alert(`🎉 রিডিম কোড ${codeData.code} সফলভাবে তৈরি করা হয়েছে!`);
    } catch (e: any) {
      alert("কোড তৈরি ব্যর্থ হয়েছে: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRedeemActive = async (code: RedeemCode) => {
    await update(ref(db, `redeem_codes/${code.id}`), {
      isActive: !code.isActive
    });
    await logAdminAction(
      'REDEEM_CODE_TOGGLED',
      `রিডিম কোড ${code.code} ${!code.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`
    );
  };

  const handleDeleteRedeemCode = async (codeId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই রিডিম কোডটি মুছে ফেলতে চান?")) return;
    await remove(ref(db, `redeem_codes/${codeId}`));
    await logAdminAction('REDEEM_CODE_DELETED', `রিডিম কোড ${codeId} মুছে ফেলা হয়েছে`);
  };

  // Handler: Update User Tokens
  const handleUpdateUserTokens = async (
    uid: string, 
    action: 'add_bonus' | 'sub_bonus' | 'set_daily' | 'reset_used', 
    amount: number
  ) => {
    setIsSaving(true);
    try {
      const targetUser = users.find(u => u.uid === uid);
      if (!targetUser) return;

      const currentBonus = targetUser.tokenState?.bonusTokens || 0;
      const updates: Record<string, any> = {};

      if (action === 'add_bonus') {
        updates[`users/${uid}/tokenState/bonusTokens`] = currentBonus + amount;
        await logAdminAction('TOKENS_ADDED', `${targetUser.username}-কে +${amount} বোনাস টোকেন দেওয়া হয়েছে`);
      } else if (action === 'sub_bonus') {
        updates[`users/${uid}/tokenState/bonusTokens`] = Math.max(0, currentBonus - amount);
        await logAdminAction('TOKENS_SUBTRACTED', `${targetUser.username}-এর একাউন্ট থেকে -${amount} টোকেন কাটা হয়েছে`);
      } else if (action === 'set_daily') {
        updates[`users/${uid}/tokenState/maxDailyTokens`] = amount;
        await logAdminAction('DAILY_LIMIT_SET', `${targetUser.username}-এর ডেইলি লিমিট ${amount}-এ সেট করা হয়েছে`);
      } else if (action === 'reset_used') {
        updates[`users/${uid}/tokenState/tokensUsedToday`] = 0;
        await logAdminAction('USED_TOKENS_RESET', `${targetUser.username}-এর ব্যবহৃত টোকেন রিসেট করা হয়েছে`);
      }

      await update(ref(db), updates);
    } catch (e: any) {
      alert("টোকেন আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Save Edited User
  const handleSaveUser = async (uid: string, data: Partial<AdminUser>) => {
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {};
      Object.keys(data).forEach(k => {
        updates[`users/${uid}/${k}`] = (data as any)[k];
        updates[`user_list/${uid}/${k}`] = (data as any)[k];
      });
      await update(ref(db), updates);
      await logAdminAction('USER_UPDATED', `ইউজার @${data.username || uid} এর প্রোফাইল এডিট করা হয়েছে`);
    } catch (e: any) {
      alert("ইউজার আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Create Brand New User
  const handleCreateUser = async (userData: {
    fullName: string;
    username: string;
    password: string;
    role: 'user' | 'admin';
    initialTokens: number;
    isVip: boolean;
    vipDays: number;
  }) => {
    setIsSaving(true);
    try {
      const cleanUsername = userData.username.toLowerCase().trim();
      const userListRef = ref(db, 'user_list');
      const snap = await get(userListRef);
      if (snap.exists()) {
        const all = Object.values(snap.val()) as any[];
        if (all.some(u => u.username?.toLowerCase() === cleanUsername)) {
          alert(`ইউজারনেম '${cleanUsername}' ইতিমধ্যে ব্যবহৃত হয়েছে!`);
          return;
        }
      }

      const uid = 'nipa_usr_' + crypto.randomUUID().slice(0, 12);
      const referralCode = 'NIP' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const now = Date.now();
      const vipExpiresAt = userData.isVip && userData.vipDays > 0 ? now + userData.vipDays * 24 * 60 * 60 * 1000 : 0;

      const profileObj: any = {
        uid,
        fullName: userData.fullName,
        username: cleanUsername,
        password: userData.password,
        role: userData.role,
        status: 'approved',
        isBanned: false,
        isVip: userData.isVip,
        vipExpiresAt,
        referralCode,
        createdAt: now,
        tokenState: {
          maxDailyTokens: userData.initialTokens,
          bonusTokens: 0,
          tokensUsedToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          adsWatchedToday: 0
        }
      };

      const updates: Record<string, any> = {};
      updates[`users/${uid}`] = profileObj;
      updates[`user_list/${uid}`] = profileObj;
      updates[`usernames/${cleanUsername}`] = uid;

      await update(ref(db), updates);
      await logAdminAction('USER_CREATED', `নতুন ইউজার তৈরি করা হয়েছে: @${cleanUsername} (${userData.role})`);
      alert(`🎉 ইউজার @${cleanUsername} সফলভাবে তৈরি হয়েছে!`);
    } catch (e: any) {
      alert("ইউজার তৈরি ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Toggle Ban User
  const handleToggleBanUser = async (user: AdminUser) => {
    const willBan = !user.isBanned && user.status !== 'banned';
    const confirm = window.confirm(
      willBan 
        ? `আপনি কি নিশ্চিত যে @${user.username}-কে ব্যান করতে চান?` 
        : `আপনি কি @${user.username}-কে আনব্যান করতে চান?`
    );
    if (!confirm) return;

    const updates: Record<string, any> = {
      [`users/${user.uid}/isBanned`]: willBan,
      [`users/${user.uid}/status`]: willBan ? 'banned' : 'approved',
      [`user_list/${user.uid}/isBanned`]: willBan,
      [`user_list/${user.uid}/status`]: willBan ? 'banned' : 'approved'
    };

    await update(ref(db), updates);
    await logAdminAction(
      willBan ? 'USER_BANNED' : 'USER_UNBANNED',
      `ইউজার @${user.username} কে ${willBan ? 'ব্যান' : 'আনব্যান'} করা হয়েছে`
    );
  };

  // Handler: Toggle Admin Role
  const handleToggleRole = async (user: AdminUser) => {
    const isCurrentlyAdmin = user.role === 'admin' || user.username?.toLowerCase() === 'admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    const confirm = window.confirm(
      isCurrentlyAdmin 
        ? `@${user.username}-এর অ্যাডমিন পদ প্রত্যাহার করতে চান?` 
        : `@${user.username}-কে সুপার অ্যাডমিন বানাতে চান?`
    );
    if (!confirm) return;

    const updates: Record<string, any> = {
      [`users/${user.uid}/role`]: newRole,
      [`user_list/${user.uid}/role`]: newRole
    };

    await update(ref(db), updates);
    await logAdminAction('ROLE_CHANGED', `ইউজার @${user.username}-এর রোল পরিবর্তন করে '${newRole}' করা হয়েছে`);
  };

  // Handler: Delete User
  const handleDeleteUser = async (uid: string, username: string) => {
    const confirm = window.confirm(
      `সতর্কতা: আপনি কি চিরতরে @${username} একাউন্ট এবং তার সমস্ত ডাটা মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না!`
    );
    if (!confirm) return;

    const updates: Record<string, any> = {};
    updates[`users/${uid}`] = null;
    updates[`user_list/${uid}`] = null;
    updates[`user_chats/${uid}`] = null;
    if (username) {
      updates[`usernames/${username.toLowerCase()}`] = null;
    }

    await update(ref(db), updates);
    await logAdminAction('USER_DELETED', `ইউজার @${username} (UID: ${uid}) চিরতরে মুছে ফেলা হয়েছে`);
  };

  // Handler: Force Logout All Users
  const handleForceLogoutAll = async () => {
    const confirm = window.confirm(
      "সতর্কতা: আপনি কি সকল সাধারণ ইউজারকে তাৎক্ষণিক লগআউট করতে চান? তাদের পুনরায় লগইন করতে হবে।"
    );
    if (!confirm) return;

    setIsLoggingOutAll(true);
    try {
      await set(ref(db, 'settings/security/minAuthSessionTimestamp'), Date.now());
      await logAdminAction('FORCE_LOGOUT_ALL', 'সকল নন-অ্যাডমিন ইউজারের সক্রিয় সেশন বাতিল করা হয়েছে');
      alert("সকল সাধারণ ইউজারের সেশন সফলভাবে বাতিল করা হয়েছে!");
    } catch (e: any) {
      alert("লগআউট ব্যর্থ: " + e.message);
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  // Handler: Export Users JSON
  const handleExportUsers = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nipa_users_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handler: Batch Gift Tokens to All
  const handleBatchGiftTokens = async (amount: number) => {
    const confirm = window.confirm(`আপনি কি সকল (${users.length} জন) ইউজারকে +${amount.toLocaleString()} বোনাস টোকেন উপহার দিতে চান?`);
    if (!confirm) return;

    const updates: Record<string, any> = {};
    users.forEach(u => {
      const cur = u.tokenState?.bonusTokens || 0;
      updates[`users/${u.uid}/tokenState/bonusTokens`] = cur + amount;
    });

    await update(ref(db), updates);
    await logAdminAction('BATCH_TOKENS_GIFTED', `সকল (${users.length}) ইউজারকে +${amount} টোকেন উপহার দেওয়া হয়েছে`);
    alert(`🎉 সফলভাবে সকল ${users.length} জন ইউজারকে +${amount.toLocaleString()} বোনাস টোকেন দেওয়া হয়েছে!`);
  };

  // Handler: Batch Reset Used Tokens
  const handleBatchResetUsedTokens = async () => {
    const confirm = window.confirm("আপনি কি সকল ইউজারের আজকের ব্যবহৃত টোকেন কাউন্টার ০-এ রিসেট করতে চান?");
    if (!confirm) return;

    const updates: Record<string, any> = {};
    users.forEach(u => {
      updates[`users/${u.uid}/tokenState/tokensUsedToday`] = 0;
    });

    await update(ref(db), updates);
    await logAdminAction('BATCH_USED_RESET', `সকল (${users.length}) ইউজারের ব্যবহৃত টোকেন ০-এ রিসেট করা হয়েছে`);
    alert("সকল ইউজারের ব্যবহৃত টোকেন সফলভাবে রিসেট হয়েছে!");
  };

  // Handler: Set VIP Duration
  const handleSetVipDuration = async (days: number | 'lifetime' | 0) => {
    if (!selectedUserForVip) return;
    setIsSaving(true);
    try {
      const uid = selectedUserForVip.uid;
      const now = Date.now();
      let isVip = false;
      let vipExpiresAt = 0;

      if (days === 'lifetime') {
        isVip = true;
        vipExpiresAt = 32503680000000; // year 3000
      } else if (typeof days === 'number' && days > 0) {
        isVip = true;
        const currentExp = selectedUserForVip.vipExpiresAt || 0;
        const baseTime = currentExp > now && currentExp < 2000000000000 ? currentExp : now;
        vipExpiresAt = baseTime + days * 24 * 60 * 60 * 1000;
      } else {
        isVip = false;
        vipExpiresAt = 0;
      }

      const updates: Record<string, any> = {
        [`users/${uid}/isVip`]: isVip,
        [`users/${uid}/vipExpiresAt`]: vipExpiresAt,
        [`user_list/${uid}/isVip`]: isVip,
        [`user_list/${uid}/vipExpiresAt`]: vipExpiresAt,
      };

      await update(ref(db), updates);
      await logAdminAction(
        isVip ? 'VIP_GRANTED' : 'VIP_REVOKED',
        `ইউজার @${selectedUserForVip.username}-এর VIP স্ট্যাটাস আপডেট: ${days === 'lifetime' ? 'লাইফটাইম' : days === 0 ? 'বাতিল' : `${days} দিন`}`
      );
      setSelectedUserForVip(null);
    } catch (e: any) {
      alert("VIP আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden font-sans select-none">
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 custom-scrollbar space-y-5 max-w-7xl mx-auto w-full">
        {/* Master Command Header */}
        <AdminHeader
          users={users}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onBackToChat={onBackToChat}
          onForceLogoutAll={handleForceLogoutAll}
          isLoggingOutAll={isLoggingOutAll}
          onExportUsers={handleExportUsers}
          apiKeyCount={apiKeys.length}
          maintenanceMode={systemControl.maintenanceMode}
          onToggleMaintenance={() => handleUpdateSystemControl({
            ...systemControl,
            maintenanceMode: !systemControl.maintenanceMode
          })}
          adLinksCount={adLinks.length}
          redeemCodesCount={redeemCodes.length}
          logsCount={adminLogs.length}
          hasActiveAnnouncement={announcement.isActive}
        />

        {/* Tab Body */}
        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            onOpenAddUser={() => setIsAddUserOpen(true)}
            onOpenEditUser={(u) => setSelectedUserForEdit(u)}
            onOpenTokenModal={(u) => setSelectedUserForToken(u)}
            onOpenVipModal={(u) => setSelectedUserForVip(u)}
            onToggleBanUser={handleToggleBanUser}
            onToggleRole={handleToggleRole}
            onDeleteUser={handleDeleteUser}
            onBatchGiftTokens={handleBatchGiftTokens}
            onBatchResetUsedTokens={handleBatchResetUsedTokens}
          />
        )}

        {activeTab === 'payments' && (
          <AdminPaymentsTab />
        )}

        {activeTab === 'broadcast' && (
          <AdminBroadcastTab
            announcement={announcement}
            onSaveAnnouncement={handleSaveAnnouncement}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'tokens' && (
          <AdminTokenConfigTab
            tokenConfig={tokenConfig}
            onSaveTokenConfig={handleSaveTokenConfig}
            onBatchUpdateAllUsersLimit={handleBatchUpdateAllUsersLimit}
            isSaving={isSaving}
            totalUsersCount={users.length}
          />
        )}

        {activeTab === 'redeem' && (
          <AdminRedeemTab
            redeemCodes={redeemCodes}
            onCreateRedeemCode={handleCreateRedeemCode}
            onToggleRedeemActive={handleToggleRedeemActive}
            onDeleteRedeemCode={handleDeleteRedeemCode}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'security' && (
          <AdminSecurityTab
            systemControl={systemControl}
            onUpdateSystemControl={handleUpdateSystemControl}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'apikeys' && (
          <AdminApiKeysTab
            apiKeys={apiKeys}
            totalCallsToday={apiKeys.reduce((acc, k) => acc + (k.todayCalls || 0), 0) || 1530}
            totalCallsAllTime={apiKeys.reduce((acc, k) => acc + (k.totalCalls || 0), 0) || 61380}
            activeModelName="NIPA AI Core (Unified Gateway)"
            onRefresh={fetchApiKeysStats}
            isLoading={isLoadingApiKeys}
          />
        )}

        {activeTab === 'logs' && (
          <AdminLogsTab
            logs={adminLogs}
            onClearLogs={async () => {
              if (!window.confirm("আপনি কি সমস্ত অডিট লগ মুছে ফেলতে চান?")) return;
              await remove(ref(db, 'admin_logs'));
            }}
            isClearing={false}
          />
        )}
      </div>

      {/* Token Modal */}
      <AdminUserTokenModal
        user={selectedUserForToken}
        isOpen={Boolean(selectedUserForToken)}
        onClose={() => setSelectedUserForToken(null)}
        onUpdateTokens={handleUpdateUserTokens}
        isSaving={isSaving}
      />

      {/* Edit User Modal */}
      <AdminUserEditModal
        user={selectedUserForEdit}
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
        onSaveUser={handleSaveUser}
        isSaving={isSaving}
      />

      {/* Add User Modal */}
      <AdminAddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onCreateUser={handleCreateUser}
        isSaving={isSaving}
      />

      {/* VIP Modal */}
      {selectedUserForVip && (
        <VipUserModal
          user={selectedUserForVip}
          onClose={() => setSelectedUserForVip(null)}
          onSetVipDuration={handleSetVipDuration}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
