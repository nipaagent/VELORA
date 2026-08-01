import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, User, Sparkles, Code2, ShieldCheck, BrainCircuit } from 'lucide-react';
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
  onOpenDeveloper?: () => void;
  onOpenAdmin?: () => void;
}

export default function Sidebar({ isOpen, onClose, chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onClearAllChats, userProfile, tokenState, onOpenTokenModal, onSignOut, onOpenProfile, onOpenDeveloper, onOpenAdmin }: SidebarProps) {
  return (
    <div className="w-full h-full bg-white text-gray-800 flex flex-col justify-between border-r border-gray-100 shadow-sm">
      <div className="flex flex-col min-h-0 flex-1">
        <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-gray-100 bg-white">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
            <span className="font-black text-gray-900 text-sm tracking-wider uppercase">VELORA</span>
          </motion.div>

          {tokenState && onOpenTokenModal && (
            <TokenBadge tokenState={tokenState} onClick={onOpenTokenModal} />
          )}
        </div>
        
        <div className="p-2 shrink-0 flex items-center gap-1.5">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-[13px] font-black uppercase tracking-wider shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearAllChats}
            disabled={chats.length === 0}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 rounded-xl transition-colors shrink-0 border border-gray-200/80 hover:border-red-200 shadow-2xs"
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
                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border border-indigo-100 shadow-2xs' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    currentChatId === chat.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span className="truncate">{chat.title}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all focus:opacity-100"
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
              className="text-[13px] text-gray-400 px-2 py-6 text-center"
            >
              No chat history
            </motion.div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {/* Admin & Developer Links */}
        <div className="p-2 border-t border-gray-100 space-y-1.5 bg-white">
          {/* Admin Panel button - ONLY shown to username 'Admin' or 'admin' */}
          {userProfile?.username?.toLowerCase() === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAdmin}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest border border-emerald-200/80 shadow-2xs"
              title="Admin Panel"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Admin Panel</span>
            </motion.button>
          )}

          {/* Developer Portal button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDeveloper}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest border border-indigo-100/60 shadow-2xs"
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Developer Hub</span>
          </motion.button>
        </div>

        {/* User profile & logout footer */}
        {userProfile && (
          <div className="p-2.5 border-t border-gray-100 bg-slate-50/80">
            <div className="flex items-center justify-between gap-2">
              <motion.button 
                whileHover={{ x: 2 }}
                onClick={onOpenProfile}
                className="flex items-center gap-2 overflow-hidden text-left hover:bg-white p-1.5 -ml-1 rounded-xl transition-colors flex-1 group border border-transparent hover:border-slate-200/60"
                title="Profile Settings"
              >
                <UserAvatar name={userProfile.fullName || userProfile.username} size="sm" />
                <div className="overflow-hidden leading-tight flex-1">
                  <div className="text-[11px] font-black text-slate-900 truncate">{userProfile.fullName || userProfile.username}</div>
                  <div className="text-[9px] text-slate-500 truncate font-bold uppercase tracking-wider">@{userProfile.username}</div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, color: '#e11d48' }}
                whileTap={{ scale: 0.9 }}
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
