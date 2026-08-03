import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Eye, EyeOff, Check, X, 
  ShieldAlert, RefreshCw, KeyRound, ArrowLeft, Save, Sparkles, AlertCircle, ShieldCheck,
  Ban, UserCheck, ShieldX, CheckCircle2, AlertTriangle, Lock, Code2, Loader2, Tv, Plus, ExternalLink, Zap, Minus, Gift,
  Ticket, Crown, Clock, Tag, Copy, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { generateUniqueVeloraKey, cn, formatTokenCount } from '../lib/utils';
import { TokenState, RedeemCode, RedeemRewardType } from '../types';
import UserAvatar from './UserAvatar';
import { VipUserModal } from './VipUserModal';

export interface AdminUser {
  uid: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  password?: string;
  createdAt?: number;
  role?: string;
  status?: 'approved' | 'pending' | 'banned';
  isBanned?: boolean;
  isVip?: boolean;
  vipExpiresAt?: number;
  apiAccessEnabled?: boolean;
  apiKey?: string;
  tokenState?: TokenState;
}

interface AdminPageProps {
  onBackToChat?: () => void;
}

export default function AdminPage({ onBackToChat }: AdminPageProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyCount, setApiKeyCount] = useState<number>(0);
  const [apiKeysDetails, setApiKeysDetails] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
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

  // Ad Links Management state
  const [adLinks, setAdLinks] = useState<string[]>([
    "https://www.effectivecpmnetwork.com/pqga5b64q?key=b284a9c6c1b29d340ea4c11c2e497170"
  ]);
  const [newAdUrl, setNewAdUrl] = useState('');
  const [isSavingAdLinks, setIsSavingAdLinks] = useState(false);

  // System Token Configuration State (Global Daily Limit & Ad Reward per watch)
  const [globalDailyLimitInput, setGlobalDailyLimitInput] = useState<string>('50000');
  const [globalAdRewardInput, setGlobalAdRewardInput] = useState<string>('30000');
  const [isSavingGlobalConfig, setIsSavingGlobalConfig] = useState(false);

  // Redeem Codes Management State
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [newRedeemCodeText, setNewRedeemCodeText] = useState('');
  const [newRedeemRewardType, setNewRedeemRewardType] = useState<RedeemRewardType>('tokens');
  const [newRedeemTokenAmount, setNewRedeemTokenAmount] = useState('50000');
  const [newRedeemVipDays, setNewRedeemVipDays] = useState('7');
  const [newRedeemMaxUses, setNewRedeemMaxUses] = useState('10');
  const [newRedeemExpireHours, setNewRedeemExpireHours] = useState('0'); // 0 = no expiry
  const [isSavingRedeemCode, setIsSavingRedeemCode] = useState(false);
  const [redeemSearchTerm, setRedeemSearchTerm] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // User Token Control Modal state
  const [tokenModalUser, setTokenModalUser] = useState<AdminUser | null>(null);
  const [tokenAmountInput, setTokenAmountInput] = useState<string>('50000');
  const [isSavingTokenChange, setIsSavingTokenChange] = useState(false);

  // VIP / Premium Control Modal State
  const [vipModalUser, setVipModalUser] = useState<AdminUser | null>(null);
  const [isSavingVipChange, setIsSavingVipChange] = useState(false);

  // Dashboard Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'ads' | 'redeem' | 'apikeys'>('users');

  // Toast alert feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to ad links, global token_config and redeem_codes in Firebase RTDB
  useEffect(() => {
    const adRef = ref(db, 'settings/ad_links');
    const unsubscribeAd = onValue(adRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (Array.isArray(val) && val.length > 0) {
          setAdLinks(val);
        } else if (typeof val === 'object') {
          const list = Object.values(val).filter(Boolean) as string[];
          if (list.length > 0) setAdLinks(list);
        }
      }
    });

    const tokenConfigRef = ref(db, 'settings/token_config');
    const unsubscribeConfig = onValue(tokenConfigRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) {
          if (typeof val.defaultMaxDailyTokens === 'number') {
            setGlobalDailyLimitInput(val.defaultMaxDailyTokens.toString());
          }
          if (typeof val.adRewardTokenAmount === 'number') {
            setGlobalAdRewardInput(val.adRewardTokenAmount.toString());
          }
        }
      }
    });

    const redeemRef = ref(db, 'redeem_codes');
    const unsubscribeRedeem = onValue(redeemRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) {
          const list: RedeemCode[] = Object.keys(val).map(key => ({
            id: key,
            ...val[key]
          }));
          setRedeemCodes(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        } else {
          setRedeemCodes([]);
        }
      } else {
        setRedeemCodes([]);
      }
    });

    return () => {
      unsubscribeAd();
      unsubscribeConfig();
      unsubscribeRedeem();
    };
  }, []);

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `VELORA-${rand}`;
    setNewRedeemCodeText(generated);
    return generated;
  };

  const handleCreateRedeemCode = async () => {
    let cleanCode = newRedeemCodeText.trim().toUpperCase();
    if (!cleanCode) {
      cleanCode = handleGenerateRandomCode();
    }

    const maxUsesNum = Number(newRedeemMaxUses) || 1;
    if (maxUsesNum <= 0) {
      showToast("ব্যবহারকারীর সীমা অবশ্যই ১ বা তার বেশি হতে হবে!", "error");
      return;
    }

    let tokenAmt: number | undefined;
    let vipDaysNum: number | undefined;

    if (newRedeemRewardType === 'tokens') {
      tokenAmt = Number(newRedeemTokenAmount);
      if (!tokenAmt || tokenAmt <= 0) {
        showToast("দয়া করে সঠিক টোকেন সংখ্যা প্রদান করুন!", "error");
        return;
      }
    } else {
      vipDaysNum = Number(newRedeemVipDays);
      if (!vipDaysNum || vipDaysNum <= 0) {
        showToast("দয়া করে সঠিক ভিআইপি দিনের সংখ্যা প্রদান করুন!", "error");
        return;
      }
    }

    setIsSavingRedeemCode(true);
    try {
      const cleanCodeData: Record<string, any> = {
        id: cleanCode,
        code: cleanCode,
        rewardType: newRedeemRewardType,
        maxUses: maxUsesNum,
        usedCount: 0,
        createdAt: Date.now(),
        isActive: true
      };

      if (newRedeemRewardType === 'tokens' && tokenAmt) {
        cleanCodeData.tokenAmount = tokenAmt;
      } else if (newRedeemRewardType === 'vip_days' && vipDaysNum) {
        cleanCodeData.vipDays = vipDaysNum;
      }

      await set(ref(db, `redeem_codes/${cleanCode}`), cleanCodeData);
      showToast(`🎟️ রিডিম কোড '${cleanCode}' সফলভাবে তৈরি হয়েছে!`, "success");

      handleGenerateRandomCode();
    } catch (err: any) {
      showToast("রিডিম কোড তৈরি করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingRedeemCode(false);
    }
  };

  const handleToggleRedeemActive = async (codeObj: RedeemCode) => {
    try {
      await update(ref(db, `redeem_codes/${codeObj.id}`), {
        isActive: !codeObj.isActive
      });
      showToast(`কোড '${codeObj.code}' ${!codeObj.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`);
    } catch (err: any) {
      showToast("স্ট্যাটাস আপডেট করতে সমস্যা: " + err.message, "error");
    }
  };

  const handleDeleteRedeemCode = async (codeId: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে রিডিম কোড '${codeId}' ডিলিট করতে চান?`)) return;
    try {
      await remove(ref(db, `redeem_codes/${codeId}`));
      showToast(`রিডিম কোড '${codeId}' ডিলিট হয়েছে।`);
    } catch (err: any) {
      showToast("ডিলিট করতে সমস্যা: " + err.message, "error");
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(codeText);
    showToast(`কোড '${codeText}' ক্লিপবোর্ডে কপি হয়েছে!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSaveGlobalTokenConfig = async () => {
    const dailyNum = Number(globalDailyLimitInput);
    const rewardNum = Number(globalAdRewardInput);

    if (!dailyNum || dailyNum <= 0 || !rewardNum || rewardNum <= 0) {
      showToast("দয়া করে সঠিক সংখ্যা প্রদান করুন!", "error");
      return;
    }

    setIsSavingGlobalConfig(true);
    try {
      await set(ref(db, 'settings/token_config'), {
        defaultMaxDailyTokens: dailyNum,
        adRewardTokenAmount: rewardNum,
        updatedAt: Date.now()
      });
      showToast(`গ্লোবাল টোকেন সেটিংস রিয়েলটাইমে সেভ হয়েছে! ডেইলি লিমিট: ${formatTokenCount(dailyNum)} | এড রিওয়ার্ড: ${formatTokenCount(rewardNum)}`, "success");
    } catch (err: any) {
      showToast("গ্লোবাল সেটিংস সেভ করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingGlobalConfig(false);
    }
  };

  const handleApplyGlobalLimitToAllUsers = async () => {
    const dailyNum = Number(globalDailyLimitInput);
    const rewardNum = Number(globalAdRewardInput);

    if (!dailyNum || dailyNum <= 0) {
      showToast("দয়া করে সঠিক ডেইলি লিমিট টাইপ করুন!", "error");
      return;
    }

    if (users.length === 0) {
      showToast("কোন ইউজার পাওয়া যায়নি!", "error");
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে রেজিস্টার্ড সকল ${users.length} জন ইউজারের ডেলি ফ্রি লিমিট ${formatTokenCount(dailyNum)} টোকেন এ সেট ও আপডেট করতে চান?`)) {
      return;
    }

    setIsSavingGlobalConfig(true);
    try {
      // 1. Save global token_config
      await set(ref(db, 'settings/token_config'), {
        defaultMaxDailyTokens: dailyNum,
        adRewardTokenAmount: rewardNum || 30000,
        updatedAt: Date.now()
      });

      // 2. Batch update maxDailyTokens for all registered users in RTDB
      const updates: { [path: string]: any } = {};
      users.forEach(u => {
        updates[`users/${u.uid}/tokenState/maxDailyTokens`] = dailyNum;
      });
      await update(ref(db), updates);

      showToast(`সকল ${users.length} জন ইউজারের ডেলি লিমিট ${formatTokenCount(dailyNum)} টোকেনে রিয়েলটাইমে আপডেট হয়েছে!`, "success");
      await fetchUsers();
    } catch (err: any) {
      showToast("ইউজারদের ডেলি লিমিট আপডেট করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingGlobalConfig(false);
    }
  };

  const handleAddAdLink = async () => {
    if (!newAdUrl.trim()) {
      showToast("দয়া করে সঠিক অ্যাড লিংক প্রবেশ করান!", "error");
      return;
    }
    const urlToAdd = newAdUrl.trim();
    if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
      showToast("লিংকটি অবশ্যই http:// বা https:// দিয়ে শুরু হতে হবে!", "error");
      return;
    }

    const updated = [...adLinks, urlToAdd];
    setAdLinks(updated);
    setNewAdUrl('');
    setIsSavingAdLinks(true);
    try {
      await set(ref(db, 'settings/ad_links'), updated);
      showToast("অ্যাড লিংক সফলভাবে যোগ করা হয়েছে!", "success");
    } catch (e: any) {
      showToast("অ্যাড লিংক সেভ করতে সমস্যা: " + e.message, "error");
    } finally {
      setIsSavingAdLinks(false);
    }
  };

  const handleDeleteAdLink = async (indexToDelete: number) => {
    if (adLinks.length <= 1) {
      showToast("কমপক্ষে একটি অ্যাড লিংক থাকা আবশ্যক!", "error");
      return;
    }
    const updated = adLinks.filter((_, idx) => idx !== indexToDelete);
    setAdLinks(updated);
    setIsSavingAdLinks(true);
    try {
      await set(ref(db, 'settings/ad_links'), updated);
      showToast("অ্যাড লিংক মুছে ফেলা হয়েছে!", "success");
    } catch (e: any) {
      showToast("মুছতে সমস্যা হয়েছে: " + e.message, "error");
    } finally {
      setIsSavingAdLinks(false);
    }
  };

  // Realtime Token Management Handlers
  const handleOpenTokenModal = (user: AdminUser) => {
    setTokenModalUser(user);
    setTokenAmountInput('50000');
  };

  const handleApplyTokenAdd = async (amountToAdd: number) => {
    if (!tokenModalUser || amountToAdd <= 0) return;
    setIsSavingTokenChange(true);
    try {
      const userRef = ref(db, `users/${tokenModalUser.uid}/tokenState`);
      const currentState: TokenState = tokenModalUser.tokenState || {
        maxDailyTokens: 37000,
        bonusTokens: 0,
        tokensUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        adsWatchedToday: 0
      };

      const updatedState: TokenState = {
        ...currentState,
        bonusTokens: (currentState.bonusTokens || 0) + amountToAdd
      };

      await set(userRef, updatedState);
      showToast(`@${tokenModalUser.username} এর একাউন্টে +${formatTokenCount(amountToAdd)} বোনাস টোকেন যুক্ত করা হয়েছে!`, "success");
      setTokenModalUser(prev => prev ? { ...prev, tokenState: updatedState } : null);
    } catch (err: any) {
      showToast("টোকেন যোগ করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingTokenChange(false);
    }
  };

  const handleApplyTokenSubtract = async (amountToSubtract: number) => {
    if (!tokenModalUser || amountToSubtract <= 0) return;
    setIsSavingTokenChange(true);
    try {
      const userRef = ref(db, `users/${tokenModalUser.uid}/tokenState`);
      const currentState: TokenState = tokenModalUser.tokenState || {
        maxDailyTokens: 37000,
        bonusTokens: 0,
        tokensUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        adsWatchedToday: 0
      };

      let remainingDeduct = amountToSubtract;
      let currentBonus = currentState.bonusTokens || 0;
      let currentUsed = currentState.tokensUsedToday || 0;

      if (currentBonus >= remainingDeduct) {
        currentBonus -= remainingDeduct;
      } else {
        remainingDeduct -= currentBonus;
        currentBonus = 0;
        currentUsed += remainingDeduct;
      }

      const updatedState: TokenState = {
        ...currentState,
        bonusTokens: currentBonus,
        tokensUsedToday: currentUsed
      };

      await set(userRef, updatedState);
      showToast(`@${tokenModalUser.username} এর একাউন্ট থেকে -${formatTokenCount(amountToSubtract)} টোকেন মাইনাস করা হয়েছে!`, "success");
      setTokenModalUser(prev => prev ? { ...prev, tokenState: updatedState } : null);
    } catch (err: any) {
      showToast("টোকেন মাইনাস করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingTokenChange(false);
    }
  };

  const handleApplyTokenResetUsed = async () => {
    if (!tokenModalUser) return;
    setIsSavingTokenChange(true);
    try {
      const userRef = ref(db, `users/${tokenModalUser.uid}/tokenState`);
      const currentState: TokenState = tokenModalUser.tokenState || {
        maxDailyTokens: 37000,
        bonusTokens: 0,
        tokensUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        adsWatchedToday: 0
      };

      const updatedState: TokenState = {
        ...currentState,
        tokensUsedToday: 0
      };

      await set(userRef, updatedState);
      showToast(`@${tokenModalUser.username} এর ব্যবহৃত টোকেন ০ করা হয়েছে!`, "success");
      setTokenModalUser(prev => prev ? { ...prev, tokenState: updatedState } : null);
    } catch (err: any) {
      showToast("টোকেন রিসেট করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingTokenChange(false);
    }
  };

  const handleApplyMaxDailyLimit = async (newLimit: number) => {
    if (!tokenModalUser || newLimit < 0) return;
    setIsSavingTokenChange(true);
    try {
      const userRef = ref(db, `users/${tokenModalUser.uid}/tokenState`);
      const currentState: TokenState = tokenModalUser.tokenState || {
        maxDailyTokens: 100000,
        bonusTokens: 0,
        tokensUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        adsWatchedToday: 0
      };

      const updatedState: TokenState = {
        ...currentState,
        maxDailyTokens: newLimit
      };

      await set(userRef, updatedState);
      showToast(`@${tokenModalUser.username} এর দৈনিক ফ্রি লিমিট ${formatTokenCount(newLimit)} সেট করা হয়েছে!`, "success");
      setTokenModalUser(prev => prev ? { ...prev, tokenState: updatedState } : null);
    } catch (err: any) {
      showToast("লিমিট সেটে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingTokenChange(false);
    }
  };

  // Realtime VIP / Premium Management Handlers
  const handleOpenVipModal = (user: AdminUser) => {
    setVipModalUser(user);
  };

  const handleSetVipDuration = async (days: number | 'lifetime' | 0) => {
    if (!vipModalUser) return;
    setIsSavingVipChange(true);
    try {
      let isVip = false;
      let vipExpiresAt = 0;

      if (days === 'lifetime') {
        isVip = true;
        vipExpiresAt = 253402300799000; // Lifetime (Year 9999)
      } else if (typeof days === 'number' && days > 0) {
        isVip = true;
        const currentExpiry = (vipModalUser.vipExpiresAt && vipModalUser.vipExpiresAt > Date.now())
          ? vipModalUser.vipExpiresAt
          : Date.now();
        vipExpiresAt = currentExpiry + (days * 24 * 60 * 60 * 1000);
      } else {
        isVip = false;
        vipExpiresAt = 0;
      }

      await update(ref(db, `users/${vipModalUser.uid}`), {
        isVip,
        vipExpiresAt
      });

      const text = days === 'lifetime' 
        ? 'সারা জীবনের (লাইফটাইম) জন্য প্রিমিয়াম' 
        : days > 0 
          ? `${days} দিনের জন্য প্রিমিয়াম` 
          : 'প্রিমিয়াম বাতিল';

      showToast(`@${vipModalUser.username} এর প্রিমিয়াম স্ট্যাটাস (${text}) সফলভাবে সেভ করা হয়েছে!`, "success");

      setUsers(prev => prev.map(u => u.uid === vipModalUser.uid ? { ...u, isVip, vipExpiresAt } : u));
      setVipModalUser(prev => prev ? { ...prev, isVip, vipExpiresAt } : null);
    } catch (err: any) {
      showToast("প্রিমিয়াম আপডেট করতে সমস্যা: " + err.message, "error");
    } finally {
      setIsSavingVipChange(false);
    }
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
              isBanned: !!val[key].isBanned || val[key].status === 'banned',
              tokenState: val[key].tokenState
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
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setApiKeyCount(data.apiKeyCount);
        setApiKeysDetails(data.keys || []);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();

    // Stats auto-refresh for "100% Realtime" feel when modal is open
    let statsInterval: NodeJS.Timeout;
    if (activeTab === 'apikeys') {
      statsInterval = setInterval(fetchStats, 5000);
    }

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
            isBanned: !!val[key].isBanned || val[key].status === 'banned',
            tokenState: val[key].tokenState
          }));
          firebaseList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setUsers(firebaseList);

          // Update active token modal user in real-time
          setTokenModalUser((prev) => {
            if (!prev) return null;
            const liveUser = firebaseList.find(u => u.uid === prev.uid);
            return liveUser || prev;
          });
        }
      }, (error) => {
        console.warn("RTDB WebSocket Notice (handled via API):", error.message);
      });
      return () => {
        unsubscribe();
        if (statsInterval) clearInterval(statsInterval);
      };
    } catch (e) {
      console.warn("RTDB listener notice:", e);
      return () => {
        if (statsInterval) clearInterval(statsInterval);
      };
    }
  }, [activeTab]);

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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { staggerChildren: 0.05 }
        }
      }}
      className="flex-1 w-full h-full overflow-y-auto bg-slate-50/80 p-3 sm:p-4 md:p-6 text-slate-800"
    >
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' : 'bg-red-900 text-red-100 border border-red-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full space-y-3 px-2 sm:px-6 md:px-8">

        {/* Top Header & Tabs Bar */}
        <motion.div 
          variants={{
            hidden: { y: -20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } }
          }}
          className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 bg-white/50 backdrop-blur-md p-4 rounded-xl shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shrink-0"
              >
                <ShieldCheck className="w-5 h-5" />
              </motion.div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  সিস্টেম অ্যাডমিনিস্ট্রেটর প্যানেল
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2 mt-0.5">
                  VELORA REALTIME ADMIN
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <motion.span 
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>মোট ইউজার: {users.length} জন</span>
              </motion.span>

              {onBackToChat && (
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>চ্যাটে ফিরুন</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {[
              { id: 'users', label: 'Users Management', icon: Users, count: users.length, activeCls: 'bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-105' },
              { id: 'ads', label: 'Ad Links Config', icon: Tv, count: adLinks.length, activeCls: 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105' },
              { id: 'redeem', label: 'Redeem Codes', icon: Ticket, count: redeemCodes.length, activeCls: 'bg-amber-500 text-white border-amber-600 shadow-md transform scale-105' },
              { id: 'apikeys', label: 'API Keys Status', icon: KeyRound, count: apiKeyCount, activeCls: 'bg-sky-500 text-white border-sky-600 shadow-md transform scale-105' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'apikeys') fetchStats();
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-2xs border",
                  activeTab === tab.id 
                    ? tab.activeCls
                    : `bg-white hover:bg-slate-50 text-slate-600 border-slate-200`
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "animate-pulse" : "")} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px]",
                    activeTab === tab.id ? `bg-white/20 text-white` : `bg-slate-100 text-slate-500`
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* Search & Actions Bar */}
        <motion.div 
          variants={{
            hidden: { y: 10, opacity: 0 },
            visible: { y: 0, opacity: 1 }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন ইউজার তৈরি করুন</span>
          </motion.button>
        </motion.div>

        {/* Users List Container */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
          }}
          className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden"
        >
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
                  const isVipActive = Boolean(user.isVip || (user.vipExpiresAt && user.vipExpiresAt > Date.now()));

                  return (
                    <motion.div 
                      key={user.uid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                      className={`p-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBanned ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      
                      {/* User Details */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <UserAvatar name={user.fullName || user.username} avatarUrl={user.avatarUrl} size="md" />
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

                        {/* Premium VIP Badge */}
                        {isVipActive && (
                          <span className="text-[10px] font-black text-amber-950 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 border border-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.4)] animate-pulse">
                            <Crown className="w-3 h-3 text-amber-950 fill-amber-950" />
                            {user.vipExpiresAt && user.vipExpiresAt > Date.now() && user.vipExpiresAt < 2000000000000
                              ? `VIP (${Math.max(1, Math.ceil((user.vipExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))}দিন)`
                              : 'VIP (লাইফটাইম)'}
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
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => togglePasswordVisibility(user.uid)}
                            className="ml-1 text-slate-400 hover:text-slate-700 p-0.5"
                            title={visiblePasswords[user.uid] ? "Hide Password" : "Show Password"}
                          >
                            {visiblePasswords[user.uid] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </motion.button>
                        </div>

                        <div className="text-[10px] text-slate-400 font-sans">
                          UID: <span className="font-mono text-slate-600">{user.uid}</span>
                        </div>

                        {/* Token Badge */}
                        <div className="flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-extrabold text-[10px]">
                          <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                          <span>টোকেন: {formatTokenCount(Math.max(0, ((user.tokenState?.maxDailyTokens ?? 37000) + (user.tokenState?.bonusTokens ?? 0)) - (user.tokenState?.tokensUsedToday ?? 0)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap mt-2 sm:mt-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* Premium / VIP Control Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenVipModal(user)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[11px] shadow-xs transition-all cursor-pointer ${
                          isVipActive
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)] hover:brightness-105'
                            : 'bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 text-amber-900 font-extrabold'
                        }`}
                        title="ইউজারের প্রিমিয়াম/VIP অ্যাকসেস ম্যানেজ করুন"
                      >
                        <Crown className={`w-3.5 h-3.5 ${isVipActive ? 'fill-slate-950 text-slate-950' : 'text-amber-700 fill-amber-700'}`} />
                        <span>{isVipActive ? 'প্রিমিয়াম (সক্রিয়)' : '👑 প্রিমিয়াম'}</span>
                      </motion.button>

                      {/* Token Control Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenTokenModal(user)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-[10px] shadow-2xs transition-all cursor-pointer"
                        title="ইউজারের টোকেন যোগ/মাইনাস করুন"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        <span>টোকেন কন্ট্রোল</span>
                      </motion.button>
                      
                      {/* API Access Toggle Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleApiAccess(user)}
                        className={`p-2 rounded-lg border transition-all ${
                          user.apiAccessEnabled 
                            ? 'bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={user.apiAccessEnabled ? "API Access: Enabled" : "API Access: Disabled"}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Admin Toggle Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleRole(user)}
                        className={`p-2 rounded-lg border transition-all ${
                          user.role === 'admin'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={user.role === 'admin' ? "Role: Admin" : "Role: User"}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Ban / Approve Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
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
                      </motion.button>

                      {/* Edit Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                        title="এডিট"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Delete Button */}
                      <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors shadow-2xs"
                        title="ডিলিট"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )}

  {/* Seed Button - ONLY SHOWN IF LIST IS EMPTY */}
      {users.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 text-center"
        >
          <button
            onClick={handleSeedDefaultUsers}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Seed Default Demo Users (ফায়ারবেসে ডেমো ইউজার যোগ করুন)</span>
          </button>
        </motion.div>
      )}

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 space-y-4 text-slate-800 overflow-hidden"
            >
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>সেভ করুন (Save Changes)</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API KEY DETAILS TAB */}
      <AnimatePresence>
        {activeTab === 'apikeys' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="bg-slate-900 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                    <KeyRound className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2 tracking-tight uppercase">
                      API Keys Realtime Usage Stats
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live API Status Monitoring
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchStats()}
                    disabled={isStatsLoading}
                    className="px-4 py-2 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors"
                  >
                    <RefreshCw className={cn("w-4 h-4", isStatsLoading && "animate-spin")} />
                    Refresh Stats
                  </button>
                </div>
              </div>

              <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-4">
                {apiKeysDetails.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Loading API Statistics...</p>
                  </div>
                ) : (
                  <>
                    {/* SUMMARY CARDS GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3">
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">মোট Key (Total Keys)</div>
                        <div className="text-xl font-black text-indigo-950 mt-0.5">{apiKeysDetails.length} টি Active Key</div>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">আজকের রিকোয়েস্ট (Today Calls)</div>
                        <div className="text-xl font-black text-emerald-950 mt-0.5 flex items-center gap-1.5">
                          {apiKeysDetails.reduce((acc, k) => acc + (k.todayCalls || 0), 0).toLocaleString()}
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3">
                        <div className="text-[10px] font-black text-sky-600 uppercase tracking-wider">সর্বমোট রিকোয়েস্ট (Total Calls)</div>
                        <div className="text-xl font-black text-sky-950 mt-0.5">
                          {apiKeysDetails.reduce((acc, k) => acc + (k.totalCalls || 0), 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3">
                        <div className="text-[10px] font-black text-purple-600 uppercase tracking-wider">আনুমানিক টোকেন (Est. Tokens)</div>
                        <div className="text-xl font-black text-purple-950 mt-0.5">
                          {apiKeysDetails.reduce((acc, k) => acc + (k.totalTokens || 0), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* API KEY LIST CARDS */}
                    <div className="space-y-3">
                      {apiKeysDetails.map((key, idx) => {
                        const isRateLimited = key.status && key.status.includes('Rate Limited');
                        const isError = key.status && key.status.includes('Error');

                        return (
                          <motion.div 
                            key={key.name + idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 hover:shadow-md transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                    {key.name}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {key.maskedValue}
                                  </span>

                                  {/* Status Badge */}
                                  <span className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1",
                                    isRateLimited 
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : isError 
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  )}>
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isRateLimited ? "bg-amber-500 animate-ping" : isError ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                                    )} />
                                    {key.status || 'Active (Ready)'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                                    সর্বশেষ ব্যবহার: <span className="text-slate-800">{key.lastUsed ? new Date(key.lastUsed).toLocaleTimeString() : 'Never'}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                    মডেল: <span className="text-indigo-600 font-extrabold">{key.lastModel || 'N/A'}</span>
                                  </span>
                                  {key.totalTokens ? (
                                    <span className="text-purple-600 font-mono">
                                      ~{(key.totalTokens || 0).toLocaleString()} tokens used
                                    </span>
                                  ) : null}
                                </div>

                                {/* Success vs Error breakdown */}
                                {(key.successCalls > 0 || key.errorCalls > 0) && (
                                  <div className="flex items-center gap-3 text-[10px] font-bold">
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                      ✓ Success: {key.successCalls || 0}
                                    </span>
                                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                      ✕ Rate Limit / Errors: {key.errorCalls || 0}
                                    </span>
                                  </div>
                                )}

                                {/* Model Breakdown */}
                                {key.models && Object.keys(key.models).length > 0 && (
                                  <div className="pt-1 flex flex-wrap gap-1.5">
                                    {Object.entries(key.models).map(([modelName, count]: [string, any]) => (
                                      <div 
                                        key={modelName}
                                        className="px-2 py-0.5 bg-white rounded-md border border-slate-200/80 flex items-center gap-1.5 shadow-3xs"
                                      >
                                        <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-tight">{modelName.replace(/_/g, ' ')}</span>
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1 rounded border border-indigo-100">{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0 gap-3 shrink-0">
                                <div className="text-left sm:text-right">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">আজকের রিকোয়েস্ট</div>
                                  <div className="text-base font-black text-emerald-600 tabular-nums flex items-center sm:justify-end gap-1">
                                    {(key.todayCalls || 0).toLocaleString()}
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোট রিকোয়েস্ট</div>
                                  <div className="text-base font-black text-slate-900 tabular-nums">
                                    {(key.totalCalls || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      100% Real-time synchronization active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD USER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-5 space-y-4 text-slate-800"
            >
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateUser}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>ইউজার সেভ করুন</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AD LINKS & GLOBAL SETTINGS TAB */}
      <AnimatePresence>
        {activeTab === 'ads' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full text-slate-800">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-indigo-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-snug">এড সেটিংস ও গ্লোবাল টোকেন লিমিট</h3>
                    <p className="text-[11px] font-semibold text-slate-500">সকল ইউজারের ডেলি লিমিট, এড রিওয়ার্ড ও লিংক ম্যানেজমেন্ট</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* GLOBAL TOKEN & AD REWARD SETTINGS CARD */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl border border-indigo-500/30">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <h4 className="font-black text-sm text-white">গ্লোবাল টোকেন ও এড রিওয়ার্ড কনফিগ</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-900/80 text-indigo-200 border border-indigo-700 px-2 py-0.5 rounded-full">
                      ● Realtime Synced
                    </span>
                  </div>

                  {/* 1. Daily Free Limit for All Users */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>১. প্রতিদিন ডেইলি ফ্রি লিমিট (সকল ইউজার):</span>
                      <span className="text-amber-300 font-extrabold">{formatTokenCount(Number(globalDailyLimitInput) || 0)}</span>
                    </label>
                    <input
                      type="number"
                      value={globalDailyLimitInput}
                      onChange={(e) => setGlobalDailyLimitInput(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                    />
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[10000, 30000, 50000, 100000, 200000, 500000, 1000000].map(amt => (
                        <button
                          key={'dl_' + amt}
                          type="button"
                          onClick={() => setGlobalDailyLimitInput(amt.toString())}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {formatTokenCount(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Token Reward Per Ad Watch for All Users */}
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>২. প্রতিবার এড দেখে রিওয়ার্ড টোকেন (সকল ইউজার):</span>
                      <span className="text-emerald-400 font-extrabold">+{formatTokenCount(Number(globalAdRewardInput) || 0)}</span>
                    </label>
                    <input
                      type="number"
                      value={globalAdRewardInput}
                      onChange={(e) => setGlobalAdRewardInput(e.target.value)}
                      placeholder="30000"
                      className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                    />
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[5000, 10000, 20000, 30000, 50000, 100000].map(amt => (
                        <button
                          key={'ar_' + amt}
                          type="button"
                          onClick={() => setGlobalAdRewardInput(amt.toString())}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                        >
                          +{formatTokenCount(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSavingGlobalConfig}
                      onClick={handleSaveGlobalTokenConfig}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingGlobalConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>💾 গ্লোবাল সেটিং সেভ করুন</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSavingGlobalConfig}
                      onClick={handleApplyGlobalLimitToAllUsers}
                      className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingGlobalConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span>⚡ সব ইউজারের লিমিট আপডেট</span>
                    </motion.button>
                  </div>
                </div>

                {/* Add New Ad Link Box */}
                <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-3">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider block">
                    + নতুন অ্যাড লিংক যুক্ত করুন (Add New Ad Link)
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAdUrl}
                      onChange={(e) => setNewAdUrl(e.target.value)}
                      placeholder="https://www.effectivecpmnetwork.com/..."
                      className="flex-1 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddAdLink}
                      disabled={isSavingAdLinks}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingAdLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>যোগ করুন</span>
                    </motion.button>
                  </div>

                  <p className="text-[10px] text-purple-700/80 font-semibold">
                    💡 লিংক যোগ করার পর সাথে সাথে ব্যবহারকারীরা ৩০ সেকেন্ডের এড ভিউতে লিংকটি দেখতে পারবে।
                  </p>
                </div>

                {/* Default Sponsor Link Quick Button */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block">ডিফল্ট নেটওয়ার্ক লিংক</span>
                    <span className="text-[10px] text-slate-500 font-mono">effectivecpmnetwork (Direct Key)</span>
                  </div>
                  <button
                    onClick={() => {
                      setNewAdUrl("https://www.effectivecpmnetwork.com/pqga5b64q?key=b284a9c6c1b29d340ea4c11c2e497170");
                    }}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-indigo-600 font-black text-[11px] rounded-lg transition-all"
                  >
                    ইনপুটে আনুন
                  </button>
                </div>

                {/* Active Ad Links List */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                    <span>সক্রিয় অ্যাড লিংক সমূহ ({adLinks.length} টি)</span>
                    <span className="text-emerald-600 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      ● Realtime Synced
                    </span>
                  </div>

                  {adLinks.map((url, index) => (
                    <motion.div 
                      key={url + index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs hover:border-purple-200 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                            {url}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="লিংক টেস্ট করুন"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDeleteAdLink(index)}
                          disabled={adLinks.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          title={adLinks.length <= 1 ? "কমপক্ষে একটি লিংক রাখতে হবে" : "ডিলিট করুন"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER VIP / PREMIUM CONTROL MODAL (EXTRACTED SEPARATE COMPONENT) */}
      <VipUserModal
        user={vipModalUser}
        onClose={() => setVipModalUser(null)}
        onSetVipDuration={handleSetVipDuration}
        isSaving={isSavingVipChange}
      />

      {/* USER TOKEN CONTROL MODAL */}
      <AnimatePresence>
        {tokenModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTokenModalUser(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col text-slate-800"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-white to-purple-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-snug">ইউজার টোকেন কন্ট্রোল (Token Management)</h3>
                    <p className="text-[11px] font-semibold text-slate-500">@{tokenModalUser.username} ({tokenModalUser.fullName})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTokenModalUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Current Balance Overview */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> রিয়েলটাইম টোকেন স্ট্যাটাস
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md">
                      ● Live Realtime
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 text-[10px] block">ডেইলি ফ্রি লিমিট:</span>
                      <span className="text-sm font-black text-white">
                        {formatTokenCount(tokenModalUser.tokenState?.maxDailyTokens ?? 37000)}
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 text-[10px] block">বোনাস টোকেন:</span>
                      <span className="text-sm font-black text-emerald-400">
                        +{formatTokenCount(tokenModalUser.tokenState?.bonusTokens ?? 0)}
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 text-[10px] block">আজকে ব্যবহৃত:</span>
                      <span className="text-sm font-black text-rose-400">
                        -{formatTokenCount(tokenModalUser.tokenState?.tokensUsedToday ?? 0)}
                      </span>
                    </div>

                    <div className="bg-indigo-950/80 p-2.5 rounded-xl border border-indigo-700/80">
                      <span className="text-indigo-300 text-[10px] block font-bold">মোট অবশিষ্ট টোকেন:</span>
                      <span className="text-base font-black text-amber-300">
                        {formatTokenCount(Math.max(0, ((tokenModalUser.tokenState?.maxDailyTokens ?? 37000) + (tokenModalUser.tokenState?.bonusTokens ?? 0)) - (tokenModalUser.tokenState?.tokensUsedToday ?? 0)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    টোকেন পরিমাণ (Token Amount)
                  </label>
                  <input 
                    type="number"
                    value={tokenAmountInput}
                    onChange={(e) => setTokenAmountInput(e.target.value)}
                    placeholder="উদাহরণ: 50000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10000, 30000, 50000, 100000, 500000, 1000000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setTokenAmountInput(amt.toString())}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        +{formatTokenCount(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSavingTokenChange}
                    onClick={() => handleApplyTokenAdd(Number(tokenAmountInput) || 0)}
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingTokenChange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>+ টোকেন যোগ করুন</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSavingTokenChange}
                    onClick={() => handleApplyTokenSubtract(Number(tokenAmountInput) || 0)}
                    className="py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingTokenChange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                    <span>- টোকেন মাইনাস করুন</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSavingTokenChange}
                    onClick={() => handleApplyMaxDailyLimit(Number(tokenAmountInput) || 50000)}
                    className="py-2.5 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <span>⚙️ ডেলি ফ্রি লিমিট সেট</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSavingTokenChange}
                    onClick={handleApplyTokenResetUsed}
                    className="py-2.5 px-3 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <span>🔄 ব্যবহৃত টোকেন রিসেট (0)</span>
                  </motion.button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  ⚡ পরিবর্তন সাথে সাথে ইউজারের ফোনে রিয়েলটাইমে প্রযোজ্য হবে।
                </span>
                <button
                  onClick={() => setTokenModalUser(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redeem Code Generator & Management TAB */}
      <AnimatePresence>
        {activeTab === 'redeem' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm w-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shrink-0 font-black">
                    <Ticket className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug flex items-center gap-2">
                      <span>রিডিম কোড জেনারেটর ও পোর্টাল</span>
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">PROMO ENGINE</span>
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold">নির্দিষ্ট পরিমাণ টোকেন বা ভিআইপি অ্যাক্সেসের প্রমোশনাল রিডিম কোড তৈরি ও পরিচালনা করুন</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* 1. Generator Form Box */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-4 border border-amber-500/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      নতুন রিডিম কোড তৈরি করুন
                    </span>
                    <button
                      onClick={handleGenerateRandomCode}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>র‍্যান্ডম কোড জেনারেট</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Code String Input */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <span>মূল রিডিম কোড (Code Text)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newRedeemCodeText}
                          onChange={(e) => setNewRedeemCodeText(e.target.value.toUpperCase())}
                          placeholder="উদাহরণ: VELORA100K, RAMADAN2026"
                          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-black text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateRandomCode}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all shrink-0 cursor-pointer"
                        >
                          অটো জেনারেট
                        </button>
                      </div>
                    </div>

                    {/* Reward Type Option */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        পুরস্কারের ধরন (Reward Type)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewRedeemRewardType('tokens')}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                            newRedeemRewardType === 'tokens'
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                          )}
                        >
                          <Gift className="w-4 h-4" />
                          <span>টোকেন বোনাস</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewRedeemRewardType('vip_days')}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                            newRedeemRewardType === 'vip_days'
                              ? "bg-purple-500 text-white border-purple-400 shadow-md"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                          )}
                        >
                          <Crown className="w-4 h-4" />
                          <span>ভিআইপি অ্যাক্সেস</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Reward Value Input */}
                    {newRedeemRewardType === 'tokens' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 block">
                          টোকেনের পরিমাণ (Token Amount)
                        </label>
                        <input
                          type="number"
                          value={newRedeemTokenAmount}
                          onChange={(e) => setNewRedeemTokenAmount(e.target.value)}
                          placeholder="৫০,০০০"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {[10000, 30000, 50000, 100000, 500000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setNewRedeemTokenAmount(amt.toString())}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-bold rounded border border-slate-700 cursor-pointer"
                            >
                              +{formatTokenCount(amt)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 block">
                          ভিআইপি মেয়াদ (VIP Duration - Days)
                        </label>
                        <input
                          type="number"
                          value={newRedeemVipDays}
                          onChange={(e) => setNewRedeemVipDays(e.target.value)}
                          placeholder="৭ দিন"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {[1, 3, 7, 15, 30, 90].map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setNewRedeemVipDays(d.toString())}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 font-bold rounded border border-slate-700 cursor-pointer"
                            >
                              {d} দিন
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Usage Limit Field */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block">
                        সর্বোচ্চ ইউজার ব্যবহার সীমা (Max Uses)
                      </label>
                      <input
                        type="number"
                        value={newRedeemMaxUses}
                        onChange={(e) => setNewRedeemMaxUses(e.target.value)}
                        placeholder="১০ জন ব্যবহার করতে পারবে"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-slate-400">সর্বমোট কতজন আলাদা ইউজার এই প্রমো কোডটি ক্লেইম করতে পারবে</p>
                    </div>
                  </div>

                  {/* Create Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isSavingRedeemCode}
                    onClick={handleCreateRedeemCode}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSavingRedeemCode ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <Ticket className="w-4 h-4 text-slate-950" />
                        <span>🎟️ রিডিম কোড জেনারেট করুন</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* 2. Active Redeem Codes List */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span>তৈরিকৃত রিডিম কোডের তালিকা ({redeemCodes.length})</span>
                    </h4>

                    {/* Filter Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={redeemSearchTerm}
                        onChange={(e) => setRedeemSearchTerm(e.target.value)}
                        placeholder="কোড খুঁজুন..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {redeemCodes.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-semibold">
                      এখনো কোনো রিডিম কোড তৈরি করা হয়নি। উপরের ফরম পূরণ করে রিডিম কোড তৈরি করুন।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {redeemCodes
                        .filter(c => c.code.toLowerCase().includes(redeemSearchTerm.toLowerCase()))
                        .map((c) => {
                          const isExpired = c.expiresAt ? c.expiresAt < Date.now() : false;
                          const isLimitReached = (c.usedCount || 0) >= (c.maxUses || 1);

                          return (
                            <div 
                              key={c.id}
                              className={cn(
                                "p-3.5 rounded-2xl border transition-all space-y-2 relative overflow-hidden",
                                c.isActive && !isExpired && !isLimitReached
                                  ? "bg-white border-amber-200 shadow-xs hover:border-amber-300"
                                  : "bg-slate-50 border-slate-200 opacity-75"
                              )}
                            >
                              {/* Top row: Code & Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-sm text-slate-900 bg-amber-500/15 border border-amber-300 px-2.5 py-1 rounded-lg tracking-wider">
                                    {c.code}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(c.code)}
                                    title="কোড কপি করুন"
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    {copiedCodeId === c.code ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>

                                {/* Reward Badge */}
                                {c.rewardType === 'tokens' ? (
                                  <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Gift className="w-3 h-3" />
                                    +{formatTokenCount(c.tokenAmount || 0)} টোকেন
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-300" />
                                    {c.vipDays} দিন VIP
                                  </span>
                                )}
                              </div>

                              {/* Usage & Expiration Stats */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">ব্যবহার করা হয়েছে:</span>
                                  <span className="font-bold text-slate-700">
                                    {c.usedCount || 0} / {c.maxUses} জন
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-400 block text-[10px]">স্ট্যাটাস:</span>
                                  {isExpired ? (
                                    <span className="font-bold text-rose-600 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> সময় শেষ
                                    </span>
                                  ) : isLimitReached ? (
                                    <span className="font-bold text-amber-600">লিমিট পূর্ণ</span>
                                  ) : c.isActive ? (
                                    <span className="font-bold text-emerald-600">● সক্রিয় (Active)</span>
                                  ) : (
                                    <span className="font-bold text-slate-400">নিষ্ক্রিয় (Inactive)</span>
                                  )}
                                </div>
                              </div>

                              {/* Created Date & Expiration info */}
                              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                                <span>তৈরি: {new Date(c.createdAt).toLocaleDateString()}</span>
                                {c.expiresAt ? (
                                  <span>মেয়াদ: {new Date(c.expiresAt).toLocaleString()}</span>
                                ) : (
                                  <span className="text-emerald-600 font-bold">মেয়াদহীন (Lifetime)</span>
                                )}
                              </div>

                              {/* Action controls */}
                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                  onClick={() => handleToggleRedeemActive(c)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                                    c.isActive
                                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  )}
                                >
                                  {c.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                                </button>

                                <button
                                  onClick={() => handleDeleteRedeemCode(c.id)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  ডিলিট
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  ⚡ যেকোনো ইউজার কোড রিডিম করা মাত্রই তাদের ফোনে তৎক্ষণাৎ টোকেন বা ভিআইপি অ্যাক্টিভেট হবে।
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </motion.div>
  );
}
