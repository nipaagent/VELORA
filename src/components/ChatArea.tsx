import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Send, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, UserProfile } from '../types';
import { cn } from '../lib/utils';
import TypingIndicator from '../animations/TypingIndicator';
import TypewriterMarkdown from './TypewriterMarkdown';
import UserAvatar from './UserAvatar';

interface ChatAreaProps {
  chat: Chat | undefined | null;
  onSendMessage: (text: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
  userProfile?: UserProfile | null;
}

function ThinkingSection({ thinking, isGenerating }: { thinking: string; isGenerating: boolean }) {
  const [isOpen, setIsOpen] = useState(isGenerating);

  useEffect(() => {
    if (isGenerating) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isGenerating]);

  return (
    <div className="mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors py-1 group"
      >
        <BrainCircuit className={cn("w-3.5 h-3.5", isGenerating ? "text-indigo-500 animate-pulse" : "")} />
        <span className="text-xs font-medium">
          {isGenerating ? 'Thinking...' : 'Show thought process'}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      </button>
      
      {isOpen && (
        <div className="mt-2 px-4 py-3 bg-slate-50/80 rounded-xl text-[13px] text-slate-600 leading-relaxed font-sans whitespace-pre-wrap border-l-[3px] border-l-indigo-300">
          {thinking}
        </div>
      )}
    </div>
  );
}

export default function ChatArea({ chat, onSendMessage, isLoading, userProfile }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const isVipActive = Boolean((userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()) || (userProfile?.isVip && (!userProfile?.vipExpiresAt || userProfile.vipExpiresAt === 0)));

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setIsAutoScrollEnabled(isAtBottom);
  };

  useEffect(() => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [chat?.messages, isLoading, isAutoScrollEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsAutoScrollEnabled(true);
    onSendMessage(input.trim());
    setInput('');
  };

  const messages = chat?.messages || [];

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-1 sm:px-2 md:px-3 py-4 sm:py-6 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm mx-auto">
              <Bot className="w-7 h-7 text-slate-800" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5">Velora Assistant</h2>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">High-performance AI assistant ready to write code, answer questions, and solve problems.</p>
          </div>
        ) : (
          <div className="w-full max-w-full space-y-5 pb-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isGenerating = isLoading && idx === messages.length - 1;
                return (
                  <motion.div 
                    
                    initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ 
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      mass: 0.8,
                      opacity: { duration: 0.2 },
                      filter: { duration: 0.2 }
                    }}
                    key={msg.id} 
                    className={cn(
                      "flex w-full",
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                  <div className="flex gap-3 max-w-[95%] xl:max-w-[85%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    
                    <div 
                      className={cn(
                        "px-4 py-3 shadow-xs text-[13px] sm:text-sm min-w-0 break-words overflow-hidden",
                        isUser 
                          ? 'bg-slate-900 text-white rounded-2xl rounded-tr-xs' 
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-tl-xs'
                      )}
                    >
                      {!isUser && msg.thinking && (
                        <ThinkingSection 
                          thinking={msg.thinking} 
                          isGenerating={isGenerating} 
                        />
                      )}
                      
                      {!isUser ? (
                        <div className="w-full text-slate-800">
                          <TypewriterMarkdown text={msg.text} isGenerating={isGenerating} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                    </div>

                    {isUser && (
                      <UserAvatar name={userProfile?.fullName || userProfile?.username || "User"} avatarIndex={userProfile?.avatarIndex || 0} size="sm" />
                    )}
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
            
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div 
                
                initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)", transition: { duration: 0.2 } }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.2 }
                }}
                className="flex w-full justify-start"
              >
                <div className="flex gap-3 max-w-full">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-2">
                    <TypingIndicator />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Box Area */}
      <div className="p-3 sm:pb-5 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent shrink-0">
        <div className="w-full max-w-3xl mx-auto relative">
          {isLoading && (
            <div className="flex items-center justify-end mb-1.5 px-2">
              <div className="flex items-center gap-1.5">
                <div 
                  className={cn("w-1.5 h-1.5 rounded-full animate-pulse", !isVipActive && "bg-indigo-600")}
                  style={isVipActive ? { backgroundColor: 'var(--user-theme-color)' } : {}}
                />
                <span 
                  className={cn("text-[10px] font-bold uppercase tracking-wider", !isVipActive && "text-indigo-600")}
                  style={isVipActive ? { color: 'var(--user-theme-color)' } : {}}
                >
                  Generating
                </span>
              </div>
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2 transition-all",
              isVipActive
                ? "border-2 shadow-lg focus-within:ring-4"
                : "border border-slate-200 shadow-md focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/10"
            )}
            style={isVipActive ? { 
              borderColor: 'var(--user-theme-color)',
              boxShadow: `0 0 calc(22px * var(--user-theme-glow)) rgba(var(--user-theme-color-rgb), 0.35)`,
              outlineColor: 'var(--user-theme-color)'
            } : {}}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message here..."
              className="flex-1 max-h-32 min-h-[38px] bg-transparent resize-none border-0 focus:ring-0 py-1.5 px-0 text-sm text-slate-800 placeholder-slate-400 leading-relaxed outline-none custom-scrollbar"
              rows={1}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-xl shrink-0 transition-all outline-none",
                input.trim() && !isLoading 
                  ? (isVipActive ? "text-white shadow-md" : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs")
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
              style={isVipActive && input.trim() && !isLoading ? { 
                backgroundColor: 'var(--user-theme-color)',
                boxShadow: `0 4px 12px rgba(var(--user-theme-color-rgb), 0.3)`
              } : {}}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
