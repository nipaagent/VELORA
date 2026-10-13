import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, User, Sparkles, ShieldCheck, BrainCircuit, Gift, Settings } from 'lucide-react';
import { Chat, UserProfile, TokenState } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import UserAvatar from './UserAvatar';
import TokenBadge from './TokenBadge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAllChats?: () => void;
  userProfile: UserProfile | null;
  tokenState?: TokenState;
  onOpenTokenModal?: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenReferral?: () => void;
  onOpenAdmin?: () => void;
  isSharedSession?: boolean;
}

export default function Sidebar({ isOpen, onClose, chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onClearAllChats, userProfile, tokenState, onOpenTokenModal, onSignOut, onOpenProfile, onOpenReferral, onOpenAdmin, isSharedSession }: SidebarProps) {
  return (
    <div className="w-full h-full bg-white text-gray-800 flex flex-col justify-between border-r border-gray-100 shadow-sm">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-gray-100 bg-white">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4.5 h-4.5 text-zinc-900 dark:text-zinc-100" />
            <span className="font-black text-zinc-900 text-sm tracking-wider uppercase">NIPA</span>
          </motion.div>
        </div>
        
        <div className="p-2 shrink-0 flex items-center gap-1.5">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-[13px] font-black uppercase tracking-wider shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearAllChats}
            disabled={chats.length === 0}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 rounded-xl transition-colors shrink-0 border border-zinc-200 shadow-2xs"
            title="সব চ্যাট হিস্টোরি ডিলিট করুন (Delete All History)"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0 custom-scrollbar">
          <AnimatePresence initial={false}>
            {chats.map((chat, idx) => (
              <motion.div 
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors text-[13px]",
                  currentChatId === chat.id 
                    ? 'bg-zinc-900 text-white font-bold border border-zinc-900 shadow-2xs' 
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    currentChatId === chat.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-600"
                  )} />
                  <span className="truncate">{chat.title}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className={cn(
                    "p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100",
                    currentChatId === chat.id ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" : "hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900"
                  )}
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {chats.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[13px] text-zinc-400 px-2 py-6 text-center"
            >
              No chat history
            </motion.div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {/* Admin Links - Hidden in Shared Mode */}
        {!isSharedSession && (
          <div className="p-2 border-t border-zinc-200 space-y-1.5 bg-white">
            {(userProfile?.role === 'admin' || userProfile?.username?.toLowerCase() === 'admin') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenAdmin}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest border border-zinc-300 shadow-2xs"
                title="Admin Panel"
              >
                <ShieldCheck className="w-4 h-4 text-zinc-900" />
                <span>Admin Panel</span>
              </motion.button>
            )}
          </div>
        )}

        {/* User profile & logout footer */}
        {userProfile && (
          <div className="p-2.5 border-t border-zinc-200 bg-zinc-50">
            {isSharedSession ? (
              <div className="flex items-center justify-between gap-2 p-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    SS
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Shared Session</span>
                    <span className="text-xs font-bold text-zinc-900 truncate block">{userProfile.fullName || userProfile.username}</span>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-200 text-zinc-900 hover:bg-zinc-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="প্রস্থান"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>প্রস্থান</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <motion.button 
                  whileHover={{ x: 2 }}
                  onClick={onOpenProfile}
                  className="flex items-center gap-3 overflow-hidden text-left hover:bg-white p-1.5 rounded-xl transition-colors flex-1 group border border-transparent hover:border-zinc-200"
                  title="Settings"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 text-white">
                    <Settings className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="overflow-hidden leading-tight flex-1 mt-0.5">
                    <div className="text-xs font-black text-zinc-900 truncate tracking-tight uppercase">Settings</div>
                    <div className="text-[9px] text-zinc-500 truncate font-bold uppercase tracking-widest mt-0.5">Preferences & Data</div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onSignOut}
                  className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
