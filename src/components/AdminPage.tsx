import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { ref, onValue, set, remove, update, push, get } from 'firebase/database';
import { 
  LayoutDashboard, Users, CreditCard, Zap, Crown, 
  ShieldCheck, KeyRound, Radio, RefreshCw, Settings, 
  ArrowLeft, Search, Command, ChevronLeft, ChevronRight, 
  Menu, X, Power, FileDown, LogOut, Check, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { AdminTokensTab } from './admin/AdminTokensTab';
import { AdminTokenConfigTab } from './admin/AdminTokenConfigTab';
import { AdminRedeemTab } from './admin/AdminRedeemTab';
import { AdminSecurityTab } from './admin/AdminSecurityTab';
import { AdminApiKeysTab } from './admin/AdminApiKeysTab';
import { AdminBroadcastTab } from './admin/AdminBroadcastTab';
import { AdminLogsTab } from './admin/AdminLogsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminUserTokenModal } from './admin/AdminUserTokenModal';
import { AdminUserEditModal } from './admin/AdminUserEditModal';
import { AdminAddUserModal } from './admin/AdminAddUserModal';
import VipUserModal from './VipUserModal';
import { AdminUser, AdminLog, ApiKeyDetail } from './admin/adminTypes';
import { SystemAnnouncement, SystemControl, RedeemCode } from '../types';
import { cn } from '../lib/utils';

interface AdminPageProps {
  onBackToChat?: () => void;
}

export type AdminTabId = 
  | 'overview' 
  | 'users' 
  | 'payments' 
  | 'tokens' 
  | 'redeem' 
  | 'security' 
  | 'apikeys' 
  | 'broadcast' 
  | 'logs' 
  | 'settings';

export default function AdminPage({ onBackToChat }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

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

  // API Keys status
  const [apiKeys, setApiKeys] = useState<ApiKeyDetail[]>([
    {
      name: 'NIPA AI GATEWAY',
      maskedValue: 'nipa-••••••••••••••••••••••••7777',
      status: 'Active',
      todayCalls: 0,
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0
    },
    {
      name: 'IMRAN BY NIPA GATEWAY',
      maskedValue: 'imrn-••••••••••••••••••••••••NIPA',
      status: 'Active',
      todayCalls: 0,
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0
    },
    {
      name: 'NIPA UNOROUTER GATEWAY',
      maskedValue: 'sk-0i4••••••••••••••••••••••••8lwk',
      status: 'Active',
      todayCalls: 0,
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0
    }
  ]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);

  const fetchApiKeysStats = async () => {
    setIsLoadingApiKeys(true);
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const res = await fetch('/api/admin/stats', {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
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

  // Keyboard shortcut for Ctrl+K / Cmd+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Listeners from Firebase RTDB
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUsers([]);
        return;
      }
      const data = snapshot.val();
      const list: AdminUser[] = Object.keys(data).map((uid) => ({
        uid,
        ...data[uid]
      }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(list);
    }, (error) => {
      console.warn("Failed to load users from RTDB:", error);
      setUsers([]);
    });

    const redeemRef = ref(db, 'redeem_codes');
    const unsubRedeem = onValue(redeemRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRedeemCodes([]);
        return;
      }
      const data = snapshot.val();
      const list: RedeemCode[] = Object.keys(data).map(k => ({
        id: k,
        ...data[k]
      }));
      setRedeemCodes(list);
    }, (error) => {
      console.warn("Failed to load redeem_codes from RTDB:", error);
      setRedeemCodes([]);
    });

    const tokenConfigRef = ref(db, 'settings/token_config');
    const unsubTokenCfg = onValue(tokenConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        setTokenConfig(snapshot.val());
      }
    }, (error) => {
      console.warn("Failed to load token_config from RTDB:", error);
      setTokenConfig({
        adRewardTokenAmount: 30000,
        defaultMaxDailyTokens: 50000,
        tokenMultiplier: 1
      });
    });

    const adLinksRef = ref(db, 'settings/ad_links');
    const unsubAdLinks = onValue(adLinksRef, (snapshot) => {
      if (snapshot.exists()) {
        setAdLinks(snapshot.val() || []);
      }
    }, (error) => {
      console.warn("Failed to load ad_links from RTDB:", error);
      setAdLinks([]);
    });

    const annRef = ref(db, 'settings/announcement');
    const unsubAnn = onValue(annRef, (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.val());
      }
    }, (error) => {
      console.warn("Failed to load announcement from RTDB:", error);
      setAnnouncement({
        isActive: false,
        title: '',
        message: '',
        type: 'info',
        linkUrl: '',
        linkText: '',
        updatedAt: Date.now()
      });
    });

    const sysRef = ref(db, 'settings/system_control');
    const unsubSys = onValue(sysRef, (snapshot) => {
      if (snapshot.exists()) {
        setSystemControl(snapshot.val());
      }
    }, (error) => {
      console.warn("Failed to load system_control from RTDB:", error);
      setSystemControl({
        maintenanceMode: false,
        maintenanceNotice: 'সার্ভার রক্ষণাবেক্ষণের কাজ চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।',
        allowRegistration: true,
        aiChatEnabled: true,
        adRewardsEnabled: true
      });
    });

    const logsRef = ref(db, 'admin_logs');
    const unsubLogs = onValue(logsRef, (snapshot) => {
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
    }, (error) => {
      console.warn("Failed to load admin_logs from RTDB:", error);
      setAdminLogs([]);
    });

    return () => {
      unsubUsers();
      unsubRedeem();
      unsubTokenCfg();
      unsubAdLinks();
      unsubAnn();
      unsubSys();
      unsubLogs();
    };
  }, []);

  // Handlers
  const handleUpdateSystemControl = async (ctrl: SystemControl) => {
    setIsSaving(true);
    try {
      await set(ref(db, 'settings/system_control'), ctrl);
      await logAdminAction(
        'SYSTEM_CONTROL_UPDATED',
        `সিস্টেম কন্ট্রোল আপডেট: মেইনটেন্যান্স=${ctrl.maintenanceMode ? 'অন' : 'অফ'}, রেজিস্ট্রেশন=${ctrl.allowRegistration ? 'অন' : 'অফ'}`
      );
    } catch (e: any) {
      alert("সিস্টেম সেটিং সংরক্ষণ ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnnouncement = async (ann: SystemAnnouncement) => {
    setIsSaving(true);
    try {
      await set(ref(db, 'settings/announcement'), ann);
      await logAdminAction('ANNOUNCEMENT_UPDATED', `সিস্টেম ব্রডকাস্ট আপডেট করা হয়েছে: "${ann.title}"`);
      alert("ব্রডকাস্ট ঘোষণা সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (e: any) {
      alert("সংরক্ষণ ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTokenConfig = async (cfg: typeof tokenConfig) => {
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
        `নতুন রিডিম কোড তৈরি: ${codeData.code}`
      );
      alert(`🎉 রিডিম কোড ${codeData.code} সফলভাবে তৈরি করা হয়েছে!`);
    } catch (e: any) {
      alert("কোড তৈরি ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRedeemActive = async (code: RedeemCode) => {
    await update(ref(db, `redeem_codes/${code.id}`), {
      isActive: !code.isActive
    });
  };

  const handleDeleteRedeemCode = async (codeId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই রিডিম কোডটি মুছে ফেলতে চান?")) return;
    await remove(ref(db, `redeem_codes/${codeId}`));
  };

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
      } else if (action === 'sub_bonus') {
        updates[`users/${uid}/tokenState/bonusTokens`] = Math.max(0, currentBonus - amount);
      } else if (action === 'set_daily') {
        updates[`users/${uid}/tokenState/maxDailyTokens`] = amount;
      } else if (action === 'reset_used') {
        updates[`users/${uid}/tokenState/tokensUsedToday`] = 0;
      }

      await update(ref(db), updates);
      await logAdminAction('TOKEN_UPDATE', `${targetUser.username} এর টোকেন পরিবর্তন করা হয়েছে`);
    } catch (e: any) {
      alert("টোকেন আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async (uid: string, data: Partial<AdminUser>) => {
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {};
      Object.keys(data).forEach(k => {
        updates[`users/${uid}/${k}`] = (data as any)[k];
        updates[`user_list/${uid}/${k}`] = (data as any)[k];
      });
      await update(ref(db), updates);
      await logAdminAction('USER_UPDATED', `ইউজার @${data.username || uid} প্রোফাইল এডিট`);
    } catch (e: any) {
      alert("ইউজার আপডেট ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (newUser: Partial<AdminUser>) => {
    setIsSaving(true);
    try {
      const uid = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanUsername = (newUser.username || '').toLowerCase().trim();
      const userPayload: any = {
        uid,
        username: cleanUsername,
        fullName: newUser.fullName || cleanUsername,
        email: newUser.email || `${cleanUsername}@nipa.app`,
        password: newUser.password || '123456',
        role: newUser.role || 'user',
        isBanned: false,
        createdAt: Date.now(),
        tokenState: {
          maxDailyTokens: 50000,
          bonusTokens: newUser.tokenState?.bonusTokens || 0,
          tokensUsedToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        }
      };

      const updates: Record<string, any> = {
        [`users/${uid}`]: userPayload,
        [`user_list/${uid}`]: userPayload,
        [`usernames/${cleanUsername}`]: uid
      };

      await update(ref(db), updates);
      await logAdminAction('MANUAL_USER_CREATED', `নতুন ইউজার ম্যানুয়ালি তৈরি: @${cleanUsername}`);
      setIsAddUserOpen(false);
      alert(`🎉 ইউজার @${cleanUsername} সফলভাবে তৈরি করা হয়েছে!`);
    } catch (e: any) {
      alert("ইউজার তৈরি ব্যর্থ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBanUser = async (user: AdminUser) => {
    const newStatus = !user.isBanned;
    const updates: Record<string, any> = {
      [`users/${user.uid}/isBanned`]: newStatus,
      [`users/${user.uid}/status`]: newStatus ? 'banned' : 'active',
      [`user_list/${user.uid}/isBanned`]: newStatus,
      [`user_list/${user.uid}/status`]: newStatus ? 'banned' : 'active'
    };
    await update(ref(db), updates);
    await logAdminAction(newStatus ? 'USER_BANNED' : 'USER_UNBANNED', `@${user.username} ${newStatus ? 'ব্যান' : 'আনব্যান'}`);
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updates: Record<string, any> = {
      [`users/${user.uid}/role`]: newRole,
      [`user_list/${user.uid}/role`]: newRole
    };
    await update(ref(db), updates);
  };

  const handleDeleteUser = async (uid: string, username: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে ইউজার @${username}-কে সম্পূর্ণ মুছে ফেলতে চান?`)) return;
    const updates: Record<string, any> = {};
    updates[`users/${uid}`] = null;
    updates[`user_list/${uid}`] = null;
    updates[`user_chats/${uid}`] = null;
    if (username) updates[`usernames/${username.toLowerCase()}`] = null;
    await update(ref(db), updates);
    await logAdminAction('USER_DELETED', `@${username} মুছে ফেলা হয়েছে`);
  };

  const handleForceLogoutAll = async () => {
    const confirm = window.confirm("আপনি কি সকল সাধারণ ইউজারকে তাৎক্ষণিক লগআউট করতে চান?");
    if (!confirm) return;
    setIsLoggingOutAll(true);
    try {
      await set(ref(db, 'settings/security/minAuthSessionTimestamp'), Date.now());
      await logAdminAction('FORCE_LOGOUT_ALL', 'সকল ইউজারের সেশন বাতিল করা হয়েছে');
      alert("সকল সাধারণ ইউজারের সেশন সফলভাবে বাতিল করা হয়েছে!");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleExportUsers = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nipa_users_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
        vipExpiresAt = 32503680000000;
      } else if (typeof days === 'number' && days > 0) {
        isVip = true;
        const currentExp = selectedUserForVip.vipExpiresAt || 0;
        const baseTime = currentExp > now && currentExp < 2000000000000 ? currentExp : now;
        vipExpiresAt = baseTime + days * 24 * 60 * 60 * 1000;
      }

      const updates: Record<string, any> = {
        [`users/${uid}/isVip`]: isVip,
        [`users/${uid}/vipExpiresAt`]: vipExpiresAt,
        [`user_list/${uid}/isVip`]: isVip,
        [`user_list/${uid}/vipExpiresAt`]: vipExpiresAt,
      };

      await update(ref(db), updates);
      setSelectedUserForVip(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Nav Items Definition
  const totalCallsAllTime = apiKeys.reduce((acc, k) => acc + (k.totalCalls || 0), 0);
  const totalCallsToday = apiKeys.reduce((acc, k) => acc + (k.todayCalls || 0), 0);
  const totalSuccess = apiKeys.reduce((acc, k) => acc + (k.successCalls || 0), 0);
  const successRate = totalCallsAllTime > 0
    ? Math.min(100, Math.max(0, Math.round((totalSuccess / totalCallsAllTime) * 100)))
    : (totalCallsToday > 0 ? Math.min(100, Math.max(0, Math.round((totalSuccess / totalCallsToday) * 100))) : 100);

  const navItems: { id: AdminTabId; label: string; icon: any; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users, badge: users.length },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'tokens', label: 'Token & Ad Config', icon: Zap },
    { id: 'redeem', label: 'Redeem Codes', icon: Crown, badge: redeemCodes.length },
    { id: 'security', label: 'Security', icon: ShieldCheck, badge: systemControl.maintenanceMode ? 'Alert' : undefined },
    { id: 'apikeys', label: 'API Gateway', icon: KeyRound, badge: `${successRate}%` },
    { id: 'broadcast', label: 'Broadcast', icon: Radio, badge: announcement.isActive ? 'Live' : undefined },
    { id: 'logs', label: 'Audit Logs', icon: RefreshCw, badge: adminLogs.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter commands for Ctrl+K
  const filteredCommands = navItems.filter(item => 
    item.label.toLowerCase().includes(commandSearch.toLowerCase())
  );

  return (
    <div className="h-full flex bg-slate-100 text-slate-900 font-sans select-none overflow-hidden selection:bg-indigo-100">
      {/* 1. Collapsible Left Sidebar (Desktop) */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 shrink-0 shadow-2xs",
        isSidebarCollapsed ? "w-16" : "w-60"
      )}>
        {/* Sidebar Brand Header */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-slate-100 bg-white">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs font-mono shrink-0 shadow-sm">
                N
              </div>
              <div className="truncate">
                <div className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                  <span>NIPA NETWORK</span>
                </div>
                <div className="text-[10px] text-indigo-600 font-bold font-mono mt-0.5">V2.7 PRO</div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs font-mono shadow-sm">
              N
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Search Trigger (Ctrl+K) */}
        {!isSidebarCollapsed && (
          <div className="p-2.5">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Jump to...</span>
              </span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer group text-left",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                        isActive ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600 border border-slate-200"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer",
                isSidebarCollapsed ? "justify-center" : ""
              )}
              title="Return to Chat"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>চ্যাটে ফিরুন</span>}
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline">Admin</span>
                <span className="text-slate-400 hidden sm:inline">/</span>
                <span className="font-bold text-slate-900 capitalize">
                  {navItems.find(i => i.id === activeTab)?.label || activeTab}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Indicators & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Command className="w-3.5 h-3.5" />
              <span>Ctrl+K</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSystemControl({
                ...systemControl,
                maintenanceMode: !systemControl.maintenanceMode
              })}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs",
                systemControl.maintenanceMode
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
              title="মেইনটেন্যান্স মোড টগল করুন"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{systemControl.maintenanceMode ? "মেইনটেন্যান্স চালু" : "অনলাইন"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportUsers}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="ইউজার ডাটা এক্সপোর্ট"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">এক্সপোর্ট</span>
            </button>

            {onBackToChat && (
              <button
                type="button"
                onClick={onBackToChat}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">চ্যাট</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Slide-Over Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.2 }}
                className="relative w-64 bg-white border-r border-slate-200 h-full p-4 flex flex-col justify-between z-10 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900">NIPA NETWORK V2.7</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="space-y-1 mt-4">
                    {navItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left",
                            isActive ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
                {onBackToChat && (
                  <button
                    onClick={onBackToChat}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                  >
                    চ্যাটে ফিরুন
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Body with Tab Panels */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/70">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'overview' && (
              <AdminOverviewTab
                users={users}
                apiKeys={apiKeys}
                systemControl={systemControl}
                onUpdateSystemControl={handleUpdateSystemControl}
                announcement={announcement}
                onNavigateTab={setActiveTab}
                onForceLogoutAll={handleForceLogoutAll}
                onExportUsers={handleExportUsers}
                isLoading={isLoadingApiKeys}
              />
            )}

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
                onBatchGiftTokens={async (amount) => {
                  const updates: Record<string, any> = {};
                  users.forEach(u => {
                    const cur = u.tokenState?.bonusTokens || 0;
                    updates[`users/${u.uid}/tokenState/bonusTokens`] = cur + amount;
                  });
                  await update(ref(db), updates);
                  alert(`সকল ইউজারকে +${amount.toLocaleString()} টোকেন দেওয়া হয়েছে!`);
                }}
                onBatchResetUsedTokens={async () => {
                  const updates: Record<string, any> = {};
                  users.forEach(u => {
                    updates[`users/${u.uid}/tokenState/tokensUsedToday`] = 0;
                  });
                  await update(ref(db), updates);
                  alert("সকল ইউজারের ব্যবহৃত টোকেন ০-এ রিসেট হয়েছে!");
                }}
              />
            )}

            {activeTab === 'payments' && (
              <AdminPaymentsTab />
            )}

            {activeTab === 'tokens' && (
              <div className="space-y-8">
                <AdminTokensTab users={users} />
                <AdminTokenConfigTab
                  tokenConfig={tokenConfig}
                  onSaveTokenConfig={handleSaveTokenConfig}
                  onBatchUpdateAllUsersLimit={handleBatchUpdateAllUsersLimit}
                  isSaving={isSaving}
                  totalUsersCount={users.length}
                />
              </div>
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
                totalCallsToday={apiKeys.reduce((acc, k) => acc + (k.todayCalls || 0), 0)}
                totalCallsAllTime={apiKeys.reduce((acc, k) => acc + (k.totalCalls || 0), 0)}
                activeModelName="NIPA AI Core (Unified Gateway)"
                onRefresh={fetchApiKeysStats}
                isLoading={isLoadingApiKeys}
              />
            )}

            {activeTab === 'broadcast' && (
              <AdminBroadcastTab
                announcement={announcement}
                onSaveAnnouncement={handleSaveAnnouncement}
                isSaving={isSaving}
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

            {activeTab === 'settings' && (
              <AdminSettingsTab
                onExportUsers={handleExportUsers}
                onNavigateTab={setActiveTab}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. Ctrl+K Command Palette Modal */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-60 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3 border-b border-slate-100 flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  placeholder="Type a section or command (e.g. users, payments, security)..."
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button 
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {filteredCommands.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsCommandPaletteOpen(false);
                        setCommandSearch('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Jump</span>
                    </button>
                  );
                })}

                {filteredCommands.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching command found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Action Modals */}
      <AdminUserTokenModal
        user={selectedUserForToken}
        isOpen={Boolean(selectedUserForToken)}
        onClose={() => setSelectedUserForToken(null)}
        onUpdateTokens={handleUpdateUserTokens}
        isSaving={isSaving}
      />

      <AdminUserEditModal
        user={selectedUserForEdit}
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
        onSaveUser={handleSaveUser}
        isSaving={isSaving}
      />

      <AdminAddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onCreateUser={handleCreateUser}
        isSaving={isSaving}
      />

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
