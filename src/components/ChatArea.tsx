import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Send, BrainCircuit, ChevronDown, ChevronUp, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, UserProfile } from '../types';
import { cn } from '../lib/utils';
import TypingIndicator from '../animations/TypingIndicator';
import TypewriterMarkdown from './TypewriterMarkdown';
import UserAvatar from './UserAvatar';

interface ChatAreaProps {
  chat: Chat | undefined | null;
  onSendMessage: (text: string, attachments?: any[]) => void;
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
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('অনুগ্রহ করে শুধুমাত্র ছবি (JPG, PNG, WebP) নির্বাচন করুন।');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ১০MB হতে পারে।');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64Url = loadEvent.target?.result as string;
        if (base64Url) {
          setAttachments(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'image',
              url: base64Url,
              name: file.name,
              mimeType: file.type
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const base64Url = loadEvent.target?.result as string;
            if (base64Url) {
              setAttachments(prev => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  type: 'image',
                  url: base64Url,
                  name: `pasted-image-${Date.now()}.png`,
                  mimeType: file.type
                }
              ]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = Boolean(input.trim());
    const hasAtts = attachments.length > 0;
    if ((!hasText && !hasAtts) || isLoading) return;

    setIsAutoScrollEnabled(true);
    const messageText = hasText ? input.trim() : (hasAtts ? 'এই ছবিটি বিশ্লেষণ করে বিস্তারিত ব্যাখ্যা দিন।' : '');
    onSendMessage(messageText, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5">Nipa Assistant</h2>
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
                      {/* Attached images preview */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-2">
                          {msg.attachments.map((att, aIdx) => (
                            <div key={aIdx} className="relative rounded-xl overflow-hidden border border-white/20 bg-black/10 shadow-sm max-w-[260px]">
                              <img 
                                src={att.url} 
                                alt={att.name || 'Attached image'} 
                                className="max-h-56 max-w-full object-contain rounded-lg"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}

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
          
          {/* Pending attachments strip */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 px-1">
              {attachments.map((att) => (
                <div key={att.id} className="relative group rounded-xl border border-indigo-200 bg-indigo-50/80 p-1.5 pr-7 flex items-center gap-2 shadow-xs">
                  <img src={att.url} alt={att.name} className="w-9 h-9 object-cover rounded-lg border border-indigo-100" />
                  <span className="text-xs font-semibold text-slate-700 max-w-[130px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute right-1.5 top-2 p-0.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-white rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 transition-all",
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
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Image Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="ছবি নির্বাচন করুন এবং এনালাইসিস করুন (Upload Image for AI Analysis)"
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0 cursor-pointer disabled:opacity-40"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={attachments.length > 0 ? "ছবি নিয়ে আপনার প্রশ্ন লিখুন (বা সরাসরি পাঠান)..." : "Type your message or upload an image..."}
              className="flex-1 max-h-32 min-h-[38px] bg-transparent resize-none border-0 focus:ring-0 py-1.5 px-0 text-sm text-slate-800 placeholder-slate-400 leading-relaxed outline-none custom-scrollbar"
              rows={1}
            />
            <button 
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={cn(
                "p-2 rounded-xl shrink-0 transition-all outline-none",
                (input.trim() || attachments.length > 0) && !isLoading 
                  ? (isVipActive ? "text-white shadow-md" : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs")
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
              style={isVipActive && (input.trim() || attachments.length > 0) && !isLoading ? { 
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
