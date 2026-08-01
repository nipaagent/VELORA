import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User, Sparkles, BrainCircuit } from 'lucide-react';
import { Chat, Message, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MenuSlide from './animations/MenuSlide';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import DeveloperPage from './components/DeveloperPage';
import AdminPage from './components/AdminPage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, set, remove, get } from 'firebase/database';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Local storage cache keys per user
        const localProfileKey = `velora-profile-${currentUser.uid}`;
        const localChatsKey = `velora-chats-${currentUser.uid}`;

        // Load local fallback data first
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
                isBanned: false
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
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
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
    return <AuthModal isOpen={true} />;
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
              onBack={() => setIsProfileOpen(false)} 
              userProfile={userProfile} 
              onUpdateProfile={(updated) => setUserProfile(updated)} 
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
                  setIsDeveloperOpen(false);
                  setIsAdminOpen(false);
                  setIsSidebarOpen(false);
                }}
                onNewChat={() => {
                  createNewChat();
                  setIsDeveloperOpen(false);
                  setIsAdminOpen(false);
                }}
                onDeleteChat={handleDeleteChat}
                onClearAllChats={handleClearAllChats}
                userProfile={userProfile}
                onSignOut={handleSignOut}
                onOpenProfile={() => {
                  setIsProfileOpen(true);
                  setIsSidebarOpen(false);
                }}
                onOpenDeveloper={() => {
                  setIsDeveloperOpen(true);
                  setIsAdminOpen(false);
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
              {/* Main Header (Single Header across the App) */}
              <header className="h-16 flex items-center px-6 bg-white border-b border-slate-100 shadow-sm shrink-0 z-10 relative">
                <div className="flex-1 flex justify-start items-center gap-2">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2.5 -ml-2 rounded-xl hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 active:scale-95 outline-none"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-base font-black text-slate-900 tracking-[0.2em] uppercase">VELORA</h1>
                </div>

                <div className="flex-1 flex justify-end items-center gap-2">
                  {userProfile && (
                    <button 
                      onClick={() => setIsProfileOpen(true)}
                      className="p-1 pl-1 pr-3 bg-white hover:bg-slate-100 transition-all rounded-full border border-slate-200/80 text-xs font-semibold text-slate-800 outline-none shadow-2xs group shrink-0 flex items-center gap-2"
                      title="Profile Settings"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 aspect-square overflow-hidden shadow-2xs">
                        {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <span className="hidden sm:inline text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                        {userProfile.fullName || userProfile.username}
                      </span>
                    </button>
                  )}
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
                      <DeveloperPage userProfile={userProfile} user={user} onBackToChat={() => setIsDeveloperOpen(false)} />
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
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
