import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User, Sparkles, BrainCircuit, Crown } from 'lucide-react';
import { Chat, Message, UserProfile, TokenState } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserAvatar from './components/UserAvatar';
import TokenBadge from './components/TokenBadge';
import TokenModal from './components/TokenModal';
import MenuSlide from './animations/MenuSlide';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import DeveloperPage from './components/DeveloperPage';
import AdminPage from './components/AdminPage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, set, remove, get, update } from 'firebase/database';
import { formatTokenCount, cn } from './lib/utils';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const defaultTokenState: TokenState = {
  maxDailyTokens: 50000,
  bonusTokens: 0,
  tokensUsedToday: 0,
  lastResetDate: getTodayStr(),
  adsWatchedToday: 0
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [profileScrollToReferral, setProfileScrollToReferral] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenState, setTokenState] = useState<TokenState>(defaultTokenState);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [urlReferralCode, setUrlReferralCode] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // Extract referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('referral');
    if (refCode) {
      setUrlReferralCode(refCode.trim().toUpperCase());
      // Clean URL after reading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adLinks, setAdLinks] = useState<string[]>([
    "https://www.effectivecpmnetwork.com/pqga5b64q?key=b284a9c6c1b29d340ea4c11c2e497170"
  ]);
  const [adRewardTokenAmount, setAdRewardTokenAmount] = useState<number>(30000);
  const [defaultMaxDailyTokens, setDefaultMaxDailyTokens] = useState<number>(50000);

  // Auto-apply referral code for existing logged-in user
  useEffect(() => {
    if (!urlReferralCode || !userProfile || !user) return;
    
    // Check if they already have a referrer
    if (userProfile.referredBy || userProfile.referredByCode) {
      setUrlReferralCode('');
      return;
    }
    
    // Check if they are trying to use their own code
    if (urlReferralCode === userProfile.referralCode) {
      setUrlReferralCode('');
      return;
    }

    // To prevent multiple calls, we clear urlReferralCode locally right away
    const codeToApply = urlReferralCode;
    setUrlReferralCode('');

    const applyReferral = async () => {
      try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        if (!snapshot.exists()) return;
        
        const allUsers = snapshot.val();
        const referrer = Object.values(allUsers).find((u: any) => u.referralCode === codeToApply) as any;
        
        if (!referrer) return; // Invalid code

        const currentUserRef = ref(db, `users/${userProfile.uid}`);
        const referrerRef = ref(db, `users/${referrer.uid}`);

        // 1. Update Current User: +50k tokens, set referredBy
        const currentBonus = (userProfile.tokenState?.bonusTokens || 0);
        const userUpdates: any = {
          'tokenState/bonusTokens': currentBonus + 50000,
          'referredBy': referrer.uid,
          'referredByCode': codeToApply,
          'referredByName': referrer.fullName || referrer.username
        };
        await update(currentUserRef, userUpdates);

        // 2. Update Referrer: +100k tokens, increment count, check milestones
        const referrerBonus = (referrer.tokenState?.bonusTokens || 0);
        const newReferralCount = (referrer.referralCount || 0) + 1;
        
        let extraVipDays = 0;
        if (newReferralCount === 10) extraVipDays = 3;
        else if (newReferralCount === 20) extraVipDays = 10;
        else if (newReferralCount === 30) extraVipDays = 20;

        const referrerUpdates: any = {
          'tokenState/bonusTokens': referrerBonus + 100000,
          'referralCount': newReferralCount
        };

        if (extraVipDays > 0) {
          const currentVipExpiry = referrer.vipExpiresAt || 0;
          const baseTime = Math.max(currentVipExpiry, Date.now());
          referrerUpdates['vipExpiresAt'] = baseTime + (extraVipDays * 24 * 60 * 60 * 1000);
          referrerUpdates['isVip'] = true;
        }

        await update(referrerRef, referrerUpdates);
        alert('রেফারেল লিংক থেকে সফলভাবে ৫০,০০০ বোনাস টোকেন যুক্ত হয়েছে!');
      } catch (err) {
        console.error("Auto referral error:", err);
      }
    };

    applyReferral();
  }, [urlReferralCode, userProfile, user]);

  // Inject dynamic theme color CSS variable based on user profile
  useEffect(() => {
    const themeColor = userProfile?.themeColor || '#4f46e5';
    const themeGlow = userProfile?.themeGlow ?? 0.5;
    
    document.documentElement.style.setProperty('--user-theme-color', themeColor);
    document.documentElement.style.setProperty('--user-theme-glow', themeGlow.toString());
    
    // Calculate RGB for transparency variations
    const r = parseInt(themeColor.slice(1, 3), 16);
    const g = parseInt(themeColor.slice(3, 5), 16);
    const b = parseInt(themeColor.slice(5, 7), 16);
    
    document.documentElement.style.setProperty('--user-theme-color-rgb', `${r}, ${g}, ${b}`);
    document.documentElement.style.setProperty('--user-theme-color-soft', `rgba(${r}, ${g}, ${b}, 0.1)`);
    document.documentElement.style.setProperty('--user-theme-color-border', `rgba(${r}, ${g}, ${b}, 0.2)`);
  }, [userProfile?.themeColor, userProfile?.themeGlow]);

  // Sync ad links and system token config from Firebase RTDB in Realtime
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
          if (typeof val.adRewardTokenAmount === 'number' && val.adRewardTokenAmount > 0) {
            setAdRewardTokenAmount(val.adRewardTokenAmount);
          }
          if (typeof val.defaultMaxDailyTokens === 'number' && val.defaultMaxDailyTokens > 0) {
            setDefaultMaxDailyTokens(val.defaultMaxDailyTokens);
          }
        }
      }
    });

    return () => {
      unsubscribeAd();
      unsubscribeConfig();
    };
  }, []);

  const updateTokenState = async (newState: TokenState) => {
    setTokenState(newState);
    if (user) {
      const localTokensKey = `velora-tokens-${user.uid}`;
      localStorage.setItem(localTokensKey, JSON.stringify(newState));
      try {
        await set(ref(db, `users/${user.uid}/tokenState`), newState);
      } catch (e) {
        console.warn("Failed to update tokenState in RTDB:", e);
      }
    }
  };

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Local storage cache keys per user
        const localProfileKey = `velora-profile-${currentUser.uid}`;
        const localChatsKey = `velora-chats-${currentUser.uid}`;
        const localTokensKey = `velora-tokens-${currentUser.uid}`;
        const todayStr = getTodayStr();

        // Load local fallback tokens
        const cachedTokens = localStorage.getItem(localTokensKey);
        if (cachedTokens) {
          try {
            const parsed = JSON.parse(cachedTokens);
            if (parsed.lastResetDate === todayStr) {
              setTokenState(parsed);
            } else {
              const maxDaily = parsed.maxDailyTokens || 50000;
              const curBonus = parsed.bonusTokens || 0;
              const usedToday = parsed.tokensUsedToday || 0;
              const bonusSpent = Math.max(0, usedToday - maxDaily);
              const remainingBonus = Math.max(0, curBonus - bonusSpent);

              setTokenState({
                maxDailyTokens: maxDaily,
                bonusTokens: remainingBonus,
                tokensUsedToday: 0,
                lastResetDate: todayStr,
                adsWatchedToday: 0
              });
            }
          } catch (e) {}
        } else {
          setTokenState({
            maxDailyTokens: 50000,
            bonusTokens: 0,
            tokensUsedToday: 0,
            lastResetDate: todayStr,
            adsWatchedToday: 0
          });
        }

        // Load local fallback profile data
        const cachedProfile = localStorage.getItem(localProfileKey);
        const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
        const defaultProfile: UserProfile = cachedProfile ? JSON.parse(cachedProfile) : {
          uid: currentUser.uid,
          fullName: fallbackName,
          username: fallbackName,
          createdAt: Date.now()
        };
        setUserProfile(defaultProfile);

        const cachedChats = localStorage.getItem(localChatsKey);
        if (cachedChats) {
          try {
            setChats(JSON.parse(cachedChats));
          } catch (e) {
            console.warn("Local chat cache parse warning:", e);
          }
        }

        // Fetch User Profile and subscribe to Realtime ban status
        let unsubscribeUserRef = () => {};
        try {
          const userRef = ref(db, `users/${currentUser.uid}`);
          unsubscribeUserRef = onValue(userRef, async (snapshot) => {
            if (snapshot.exists()) {
              const prof = snapshot.val();
              if (prof.status === 'banned' || prof.isBanned === true) {
                alert("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত (Banned) করা হয়েছে। (Your account has been banned by the Administrator.)");
                signOut(auth);
                setUser(null);
                setUserProfile(null);
                return;
              }
              setUserProfile(prof);
              localStorage.setItem(localProfileKey, JSON.stringify(prof));

              // Auto-generate referral code if missing (for older accounts)
              if (!prof.referralCode) {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                update(userRef, { referralCode: newCode }).catch(() => {});
              }

              if (prof.tokenState) {
                const todayStr = getTodayStr();
                if (prof.tokenState.lastResetDate === todayStr) {
                  setTokenState(prof.tokenState);
                  localStorage.setItem(localTokensKey, JSON.stringify(prof.tokenState));
                } else {
                  const maxDaily = prof.tokenState.maxDailyTokens || defaultMaxDailyTokens || 50000;
                  const curBonus = prof.tokenState.bonusTokens || 0;
                  const usedToday = prof.tokenState.tokensUsedToday || 0;
                  const bonusSpent = Math.max(0, usedToday - maxDaily);
                  const remainingBonus = Math.max(0, curBonus - bonusSpent);

                  const resetTokens: TokenState = {
                    maxDailyTokens: maxDaily,
                    bonusTokens: remainingBonus,
                    tokensUsedToday: 0,
                    lastResetDate: todayStr,
                    adsWatchedToday: 0
                  };
                  setTokenState(resetTokens);
                  localStorage.setItem(localTokensKey, JSON.stringify(resetTokens));
                  set(ref(db, `users/${currentUser.uid}/tokenState`), resetTokens).catch(() => {});
                }
              }
            } else {
              // Ensure user profile exists in Firebase RTDB
              const cleanUsername = currentUser.email ? currentUser.email.split('@')[0] : currentUser.uid;
              const initialProf: UserProfile = {
                uid: currentUser.uid,
                fullName: cleanUsername === 'admin' ? 'Velora Admin' : cleanUsername,
                username: cleanUsername,
                password: '',
                createdAt: Date.now(),
                role: cleanUsername === 'admin' ? 'admin' : 'user',
                status: 'approved',
                isBanned: false,
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
              };
              try {
                await set(userRef, initialProf);
                await set(ref(db, `usernames/${cleanUsername}`), currentUser.uid);
                setUserProfile(initialProf);
                localStorage.setItem(localProfileKey, JSON.stringify(initialProf));
              } catch (err) {
                console.warn("Failed to write initial user to RTDB:", err);
              }
            }
          });
        } catch (e) {
          console.warn("DB profile access notice (using local profile):", e);
        }

        // Subscribe to Firebase Realtime Database for chats
        let unsubscribeDb = () => {};
        try {
          const chatsRef = ref(db, `chats/${currentUser.uid}`);
          unsubscribeDb = onValue(chatsRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const chatsList: Chat[] = Object.values(data);
              chatsList.sort((a, b) => b.updatedAt - a.updatedAt);
              setChats(chatsList);
              localStorage.setItem(localChatsKey, JSON.stringify(chatsList));
            }
            setAuthLoading(false);
          }, (error) => {
            console.warn("Realtime DB sync notice (using local storage):", error);
            setAuthLoading(false);
          });
        } catch (e) {
          console.warn("Realtime DB subscription notice:", e);
          setAuthLoading(false);
        }

        return () => {
          unsubscribeUserRef();
          unsubscribeDb();
        };
      } else {
        setUserProfile(null);
        setChats([]);
        setCurrentChatId(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Global Force Logout Listener
  useEffect(() => {
    if (!user || userProfile?.role === 'admin') return;

    const forceLogoutRef = ref(db, 'settings/force_logout_timestamp');
    const unsubscribe = onValue(forceLogoutRef, (snapshot) => {
      if (snapshot.exists()) {
        const forceLogoutTime = snapshot.val();
        const lastLoginTime = Number(localStorage.getItem(`velora-last-login-${user.uid}`) || 0);
        
        if (forceLogoutTime > lastLoginTime) {
          alert("অ্যাডমিন কর্তৃক সকল ইউজারকে লগ আউট করা হয়েছে। দয়া করে আবার লগইন করুন।");
          handleSignOut();
        }
      }
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  // Sync chats to localStorage per user
  useEffect(() => {
    if (user) {
      localStorage.setItem(`velora-chats-${user.uid}`, JSON.stringify(chats));
    }
  }, [chats, user]);

  const createNewChat = () => {
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const currentChat = chats.find(c => c.id === currentChatId);

  const sendMessage = async (text: string) => {
    if (!user) return;

    let activeChatId = currentChatId;
    let targetChat: Chat;

    if (!activeChatId) {
      const newChatId = Date.now().toString();
      targetChat = {
        id: newChatId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        updatedAt: Date.now(),
      };
      activeChatId = newChatId;
      setCurrentChatId(newChatId);
    } else {
      const existing = chats.find(c => c.id === activeChatId);
      if (existing) {
        targetChat = {
          ...existing,
          title: existing.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : existing.title
        };
      } else {
        targetChat = {
          id: activeChatId,
          title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
          messages: [],
          updatedAt: Date.now(),
        };
      }
    }

    await processMessage(activeChatId, text, targetChat);
  };

  const processMessage = async (chatId: string, text: string, currentChatState: Chat) => {
    if (!user) return;

    // Check token balance & VIP status
    const isVipActive = Boolean(userProfile?.isVip || (userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()));
    const totalAvailable = (tokenState.maxDailyTokens || defaultMaxDailyTokens) + (tokenState.bonusTokens || 0);
    const remaining = isVipActive ? 999999999 : Math.max(0, totalAvailable - (tokenState.tokensUsedToday || 0));

    if (!isVipActive && remaining <= 0) {
      setIsTokenModalOpen(true);
      alert(`আপনার আজকের ${formatTokenCount(tokenState.maxDailyTokens || defaultMaxDailyTokens)} ফ্রি টোকেন এবং বোনাস টোকেন শেষ হয়ে গেছে! ${formatTokenCount(adRewardTokenAmount)} ফ্রি টোকেন পেতে একটি অ্যাড দেখুন অথবা রিডিম কোড ব্যবহার করুন।`);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const updatedWithUser: Chat = {
      ...currentChatState,
      messages: [...currentChatState.messages, userMessage],
      updatedAt: Date.now(),
    };

    // Save to Firebase Realtime Database & update local state
    setChats(prev => {
      const exists = prev.some(c => c.id === chatId);
      if (exists) {
        return prev.map(c => c.id === chatId ? updatedWithUser : c);
      }
      return [updatedWithUser, ...prev];
    });

    try {
      await set(ref(db, `chats/${user.uid}/${chatId}`), updatedWithUser);
    } catch (e) {
      console.warn("DB save error:", e);
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: currentChatState.messages.map(h => ({ role: h.role, text: h.text })),
          stream: true
        }),
      });
      
      const contentType = response.headers.get('content-type') || '';
      
      if (response.ok && contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream available");
        
        const decoder = new TextDecoder("utf-8");
        const modelMessageId = (Date.now() + 1).toString();
        let fullResponse = "";
        
        const modelMessage: Message = {
          id: modelMessageId,
          role: 'model',
          text: "",
          thinking: "",
          timestamp: Date.now(),
        };
        
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: [...c.messages, modelMessage],
              updatedAt: Date.now()
            };
          }
          return c;
        }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data:')) {
              let dataStr = trimmedLine.substring(5).trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || data.text || '';
                
                if (content) {
                  fullResponse += content;
                  
                  let currentText = fullResponse;
                  let currentThinking = '';
                  
                  const thinkingStart = currentText.indexOf('<thinking>');
                  const thinkStart = currentText.indexOf('<think>');
                  
                  const startIdx = thinkingStart !== -1 ? thinkingStart : (thinkStart !== -1 ? thinkStart : -1);
                  
                  if (startIdx !== -1) {
                    const endIdx = currentText.indexOf('</thinking>');
                    const endIdx2 = currentText.indexOf('</think>');
                    
                    const actualEndIdx = endIdx !== -1 ? endIdx : (endIdx2 !== -1 ? endIdx2 : -1);
                    
                    if (actualEndIdx !== -1) {
                      const offset = endIdx !== -1 ? 11 : 8;
                      const startOffset = thinkingStart !== -1 ? 10 : 7;
                      
                      currentThinking = currentText.substring(startIdx + startOffset, actualEndIdx).trim();
                      currentText = currentText.substring(0, startIdx) + currentText.substring(actualEndIdx + offset);
                    } else {
                      const startOffset = thinkingStart !== -1 ? 10 : 7;
                      currentThinking = currentText.substring(startIdx + startOffset).trim();
                      currentText = currentText.substring(0, startIdx);
                    }
                  }
                  
                  setChats(prev => prev.map(c => {
                    if (c.id === chatId) {
                      const newMessages = c.messages.map(m => {
                        if (m.id === modelMessageId) {
                          return { ...m, text: currentText.trim(), thinking: currentThinking };
                        }
                        return m;
                      });
                      return { ...c, messages: newMessages, updatedAt: Date.now() };
                    }
                    return c;
                  }));
                }
              } catch (e) {
                // Ignore parsing errors for incomplete JSON chunks
              }
            }
          }
        }
        
        // Calculate exact token consumption based on prompt & output character length
        const promptCharCount = text.length + (currentChatState.messages ? currentChatState.messages.reduce((acc, m) => acc + (m.text ? m.text.length : 0), 0) : 0);
        const responseCharCount = fullResponse.length;
        const requestTokensSpent = Math.max(10, Math.round((promptCharCount + responseCharCount) / 3.5));

        setTokenState(prev => {
          const updatedState = {
            ...prev,
            tokensUsedToday: (prev.tokensUsedToday || 0) + requestTokensSpent
          };
          if (user) {
            const localTokensKey = `velora-tokens-${user.uid}`;
            localStorage.setItem(localTokensKey, JSON.stringify(updatedState));
            set(ref(db, `users/${user.uid}/tokenState`), updatedState).catch(console.warn);
          }
          return updatedState;
        });

        setChats(prev => {
          const finalChat = prev.find(c => c.id === chatId);
          if (finalChat && user) {
            set(ref(db, `chats/${user.uid}/${chatId}`), finalChat).catch(console.warn);
          }
          return prev;
        });

      } else if (response.ok) {
        let data: any = {};
        try {
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const rawText = await response.text();
            try {
              data = JSON.parse(rawText);
            } catch {
              data = { content: rawText };
            }
          }
        } catch (parseErr) {
          data = { error: 'Failed to process response format.' };
        }
        
        if (data.error) {
          console.error("Error from API:", data.error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: `**Error:** ${data.error}`,
            timestamp: Date.now(),
          };
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, errorMessage] } : c));
        } else {
          // Handle successful JSON response
          let content = '';
          if (data.choices && data.choices[0]?.message?.content) {
            content = data.choices[0].message.content;
          } else if (data.text) {
            content = data.text;
          } else if (data.content) {
            content = data.content;
          } else {
            content = JSON.stringify(data);
          }

          let currentText = content;
          let currentThinking = '';
          
          const thinkingStart = currentText.indexOf('<thinking>');
          const thinkStart = currentText.indexOf('<think>');
          const startIdx = thinkingStart !== -1 ? thinkingStart : (thinkStart !== -1 ? thinkStart : -1);
          
          if (startIdx !== -1) {
            const endIdx = currentText.indexOf('</thinking>');
            const endIdx2 = currentText.indexOf('</think>');
            const actualEndIdx = endIdx !== -1 ? endIdx : (endIdx2 !== -1 ? endIdx2 : -1);
            
            if (actualEndIdx !== -1) {
              const offset = endIdx !== -1 ? 11 : 8;
              const startOffset = thinkingStart !== -1 ? 10 : 7;
              currentThinking = currentText.substring(startIdx + startOffset, actualEndIdx).trim();
              currentText = currentText.substring(0, startIdx) + currentText.substring(actualEndIdx + offset);
            }
          }

          const modelMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: currentText.trim(),
            thinking: currentThinking,
            timestamp: Date.now(),
          };

          // Calculate exact token consumption based on prompt & output character length
          const promptCharCount = text.length + (currentChatState.messages ? currentChatState.messages.reduce((acc, m) => acc + (m.text ? m.text.length : 0), 0) : 0);
          const responseCharCount = currentText.length;
          const requestTokensSpent = Math.max(10, Math.round((promptCharCount + responseCharCount) / 3.5));

          setTokenState(prev => {
            const updatedState = {
              ...prev,
              tokensUsedToday: (prev.tokensUsedToday || 0) + requestTokensSpent
            };
            if (user) {
              const localTokensKey = `velora-tokens-${user.uid}`;
              localStorage.setItem(localTokensKey, JSON.stringify(updatedState));
              set(ref(db, `users/${user.uid}/tokenState`), updatedState).catch(console.warn);
            }
            return updatedState;
          });

          setChats(prev => prev.map(c => {
            if (c.id === chatId) {
              const updatedChat = { ...c, messages: [...c.messages, modelMessage], updatedAt: Date.now() };
              if (user) set(ref(db, `chats/${user.uid}/${chatId}`), updatedChat).catch(console.warn);
              return updatedChat;
            }
            return c;
          }));
        }
      } else {
        let data: any = {};
        try {
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const rawText = await response.text();
            data = { error: rawText.length < 200 ? rawText : 'Failed to receive a valid response from the server.' };
          }
        } catch (parseErr) {
          data = { error: 'Failed to process response format.' };
        }
        
        console.error("Error from API:", data.error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `**Error:** ${data.error || 'Sorry, something went wrong while generating response.'}`,
          timestamp: Date.now(),
        };
        
        const updatedWithError: Chat = {
          ...updatedWithUser,
          messages: [...updatedWithUser.messages, errorMessage],
          updatedAt: Date.now(),
        };

        setChats(prev => prev.map(c => c.id === chatId ? updatedWithError : c));

        try {
          await set(ref(db, `chats/${user.uid}/${chatId}`), updatedWithError);
        } catch (e) {
          console.warn("DB save error:", e);
        }
      }
    } catch (e) {
      console.error("Failed to send message", e);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `**ত্রুটি:** নেটওয়ার্ক সমস্যা বা সার্ভার ডাউন।`,
        timestamp: Date.now(),
      };
      
      const updatedWithError: Chat = {
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, errorMessage],
        updatedAt: Date.now(),
      };

      setChats(prev => prev.map(c => c.id === chatId ? updatedWithError : c));

      try {
        await set(ref(db, `chats/${user.uid}/${chatId}`), updatedWithError);
      } catch (err) {
        console.warn("DB save error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
    if (!user) return;
    try {
      await remove(ref(db, `chats/${user.uid}/${id}`));
    } catch (e) {
      console.error("Failed to delete chat:", e);
    }
  };

  const handleClearAllChats = async () => {
    if (chats.length === 0) return;
    if (window.confirm("আপনি কি নিশ্চিত যে পূর্বে তৈরি করা সকল চ্যাট মুছে ফেলতে চান?")) {
      setChats([]);
      setCurrentChatId(null);
      if (user) {
        localStorage.removeItem(`velora-chats-${user.uid}`);
        try {
          await remove(ref(db, `chats/${user.uid}`));
        } catch (e) {
          console.error("Failed to clear all chats:", e);
        }
      }
    }
  };

  if (!user && !authLoading) {
    return <AuthModal isOpen={true} initialReferralCode={urlReferralCode} />;
  }

  return (
    <div className="flex h-[100dvh] bg-white text-gray-900 font-sans overflow-hidden selection:bg-indigo-100">
      <AnimatePresence mode="wait">
        {/* Full Page Profile View */}
        {isProfileOpen ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-white"
          >
            <ProfilePage 
              onBack={() => {
                setIsProfileOpen(false);
                setProfileScrollToReferral(false);
              }} 
              userProfile={userProfile} 
              onUpdateProfile={(updated) => setUserProfile(updated)} 
              scrollToReferral={profileScrollToReferral}
              onOpenDeveloper={() => {
                setIsDeveloperOpen(true);
                setIsAdminOpen(false);
                setIsProfileOpen(false);
                setIsSidebarOpen(false);
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="main-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full h-full overflow-hidden"
          >
            {/* Sidebar */}
            <MenuSlide isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
              <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={(id) => {
                  setCurrentChatId(id);
                  setIsAdminOpen(false);
                  setIsDeveloperOpen(false);
                  setIsSidebarOpen(false);
                }}
                onNewChat={() => {
                  createNewChat();
                  setIsAdminOpen(false);
                  setIsDeveloperOpen(false);
                }}
                onDeleteChat={handleDeleteChat}
                onClearAllChats={handleClearAllChats}
                userProfile={userProfile}
                tokenState={tokenState}
                onOpenTokenModal={() => setIsTokenModalOpen(true)}
                onSignOut={handleSignOut}
                onOpenProfile={() => {
                  setIsProfileOpen(true);
                  setIsSidebarOpen(false);
                }}
                onOpenReferral={() => {
                  setIsProfileOpen(true);
                  setProfileScrollToReferral(true);
                  setIsSidebarOpen(false);
                }}
                onOpenAdmin={() => {
                  setIsAdminOpen(true);
                  setIsDeveloperOpen(false);
                  setIsSidebarOpen(false);
                }}
              />
            </MenuSlide>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Main Header */}
              <header className="h-14 border-b border-slate-200/80 bg-white px-2 sm:px-3 flex items-center shrink-0 z-10 relative shadow-xs">
                <div className="flex-1 flex justify-start items-center gap-2">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-95 outline-none"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center justify-center shrink-0 relative px-4 pt-1">
                  {(() => {
                    const isVipActive = Boolean(userProfile?.isVip || (userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()));
                    return (
                      <>
                        {isVipActive && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: 5 }}
                            animate={{ 
                              scale: [1, 1.1, 1],
                              y: [0, -2, 0],
                              rotate: [-1, 1, -1],
                              opacity: 1
                            }}
                            transition={{
                              scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                              opacity: { duration: 0.3 }
                            }}
                            className="absolute -top-3.5 z-10"
                          >
                            <div className="relative flex items-center justify-center">
                              {/* Glowing background ring */}
                              <motion.div 
                                animate={{ 
                                  opacity: [0.15, 0.35, 0.15],
                                  scale: [0.8, 1.05, 0.8]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 blur-md rounded-full -z-10"
                                style={{ backgroundColor: 'var(--user-theme-color)' }}
                              />
                              
                              <Crown 
                                className="w-3.5 h-3.5 drop-shadow-[0_0_6px_var(--user-theme-color)]" 
                                style={{ color: 'var(--user-theme-color)' }}
                                fill="currentColor"
                              />
                              
                              {/* Sparkle on the crown */}
                              <motion.div
                                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                className="absolute -top-0.5 -right-0.5 w-0.5 h-0.5 bg-white rounded-full blur-[0.3px]"
                              />
                            </div>
                          </motion.div>
                        )}
                        <h1 
                          className={cn(
                            "relative text-sm font-black tracking-[0.2em] uppercase transition-all duration-500",
                            !isVipActive && "text-slate-900"
                          )}
                          style={isVipActive ? { 
                            color: 'var(--user-theme-color)',
                            filter: `drop-shadow(0 0 1px var(--user-theme-color-border))`
                          } : {}}
                        >
                          VELORA
                        </h1>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1 flex justify-end items-center gap-1.5 sm:gap-2.5 ml-auto">
                  <TokenBadge tokenState={tokenState} userProfile={userProfile} onClick={() => setIsTokenModalOpen(true)} />

                  {userProfile && (() => {
                    const isVipActive = Boolean(userProfile.isVip || (userProfile.vipExpiresAt && userProfile.vipExpiresAt > Date.now()));
                    return (
                      <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="transition-all rounded-full border-0 outline-none group shrink-0 flex items-center justify-center"
                        title="Profile Settings"
                      >
                        <div 
                          className={cn("relative rounded-full transition-all flex items-center justify-center p-[2px]", isVipActive ? "ring-2 ring-offset-2 ring-offset-white" : "")}
                          style={isVipActive ? { 
                            background: `linear-gradient(45deg, var(--user-theme-color), var(--user-theme-color-border), var(--user-theme-color))`,
                            boxShadow: `0 0 10px rgba(var(--user-theme-color-rgb), 0.2)`
                          } : {}}
                        >
                          {isVipActive && (
                            <>
                              <motion.div 
                                animate={{ 
                                  opacity: [0.2, 0.5, 0.2],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-[-4px] rounded-full border-2 pointer-events-none blur-[1px]"
                                style={{ borderColor: 'var(--user-theme-color)', opacity: 0.4 }}
                              />
                              <motion.div 
                                animate={{ 
                                  rotate: 360
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-6px] rounded-full border border-dashed pointer-events-none"
                                style={{ borderColor: 'var(--user-theme-color)', opacity: 0.3 }}
                              />
                            </>
                          )}
                          <UserAvatar name={userProfile.fullName || userProfile.username} avatarUrl={userProfile.avatarUrl} size="sm" />
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </header>

              {/* Main Body with Internal Transitions */}
              <div className="flex-1 relative overflow-hidden bg-white">
                <AnimatePresence mode="wait">
                  {isAdminOpen && userProfile?.username?.toLowerCase() === 'admin' ? (
                    <motion.div
                      key="admin-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 z-10 bg-white"
                    >
                      <AdminPage onBackToChat={() => setIsAdminOpen(false)} />
                    </motion.div>
                  ) : isDeveloperOpen ? (
                    <motion.div
                      key="developer-view"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 z-10 bg-white"
                    >
                      <DeveloperPage userProfile={userProfile!} user={user!} onBackToChat={() => setIsDeveloperOpen(false)} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <ChatArea 
                        chat={currentChat} 
                        onSendMessage={sendMessage} 
                        onNewChat={createNewChat}
                        isLoading={isLoading}
                        userProfile={userProfile}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token & Ad Modal */}
      <TokenModal 
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        tokenState={tokenState}
        adLinks={adLinks}
        adRewardTokenAmount={adRewardTokenAmount}
        defaultMaxDailyTokens={defaultMaxDailyTokens}
        userId={user?.uid}
        userProfile={userProfile}
        onUpdateProfile={(updated) => setUserProfile(updated)}
        onOpenReferral={() => {
          setIsTokenModalOpen(false);
          setIsProfileOpen(true);
          setProfileScrollToReferral(true);
        }}
        onRewardClaimed={(bonusAmount) => {
          const updated: TokenState = {
            ...tokenState,
            bonusTokens: (tokenState.bonusTokens || 0) + bonusAmount,
            adsWatchedToday: (tokenState.adsWatchedToday || 0) + 1
          };
          updateTokenState(updated);
        }}
        onVipClaimed={(vipDays, expiresAt) => {
          if (userProfile) {
            setUserProfile({
              ...userProfile,
              isVip: true,
              vipExpiresAt: expiresAt
            });
          }
        }}
      />
    </div>
  );
}
