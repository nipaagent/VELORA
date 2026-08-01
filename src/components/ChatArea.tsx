import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { Chat } from '../types';
import { cn } from '../lib/utils';
import MessageAppear from '../animations/MessageAppear';
import TypingIndicator from '../animations/TypingIndicator';
import TypewriterMarkdown from './TypewriterMarkdown';

interface ChatAreaProps {
  chat: Chat | undefined | null;
  onSendMessage: (text: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
}

function ThinkingSection({ thinking, isGenerating }: { thinking: string; isGenerating: boolean }) {
  const [isOpen, setIsOpen] = useState(isGenerating);

  useEffect(() => {
    if (!isGenerating) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isGenerating]);

  return (
    <div className="mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors py-1 group"
      >
        <BrainCircuit className={cn("w-3.5 h-3.5", isGenerating ? "text-indigo-400 animate-pulse" : "")} />
        <span className="text-xs font-medium">
          {isGenerating ? 'Thinking...' : 'Show thought process'}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /> : <ChevronDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </button>
      
      {isOpen && (
        <div className="mt-2 px-4 py-3 bg-slate-50/50 rounded-xl text-[13px] text-slate-500 leading-relaxed font-sans whitespace-pre-wrap border-l-[3px] border-l-indigo-300">
          {thinking}
        </div>
      )}
    </div>
  );
}

export default function ChatArea({ chat, onSendMessage, onNewChat, isLoading }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Check if within 150px of the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-white h-full overflow-hidden relative"
    >
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
              <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 border border-slate-100 shadow-sm mx-auto">
                <Bot className="w-8 h-8 text-slate-800" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">How can I help you today?</h2>
              <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">Velora is ready to assist you with high-speed intelligence and creative coding.</p>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6 w-full pb-8">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <MessageAppear 
                  key={msg.id} 
                  isUser={msg.role === 'user'}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className="flex gap-3 max-w-full min-w-0 group">
                    {msg.role === 'model' && (
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md"
                      >
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                    
                    <motion.div 
                      layout
                      className={cn(
                        "max-w-[92%] md:max-w-[85%] px-5 py-4 shadow-sm text-[13px] sm:text-[15px] min-w-0 break-words overflow-hidden transition-all duration-300",
                        msg.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm ring-1 ring-white/10' 
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-tl-sm'
                      )}
                    >
                      {msg.role === 'model' && msg.thinking && (
                        <div className="mb-2">
                          <ThinkingSection 
                            thinking={msg.thinking} 
                            isGenerating={isLoading && idx === messages.length - 1} 
                          />
                        </div>
                      )}
                      
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:m-0 prose-pre:p-0 prose-pre:bg-transparent">
                          <TypewriterMarkdown text={msg.text} isLatest={idx === messages.length - 1} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                    </motion.div>

                    {msg.role === 'user' && (
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      >
                        <User className="w-3.5 h-3.5 text-slate-700" />
                      </motion.div>
                    )}
                  </div>
                </MessageAppear>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <MessageAppear className="flex w-full justify-start">
                  <div className="flex gap-3 max-w-full">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2"
                    >
                      <TypingIndicator />
                    </motion.div>
                  </div>
                </MessageAppear>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <motion.div 
        layout
        className="p-3 sm:pb-6 sm:px-8 bg-gradient-to-t from-white via-white/95 to-transparent shrink-0"
      >
        <div className="max-w-6xl mx-auto relative">
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className="flex items-center justify-end mb-2 px-2"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Processing</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.form 
            onSubmit={handleSubmit}
            layout
            className="flex items-end gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 transition-all border border-slate-200/90 shadow-lg shadow-slate-200/50 hover:border-slate-300 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:shadow-xl"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Velora Coding Machine..."
              className="flex-1 max-h-32 min-h-[36px] bg-transparent resize-none border-0 focus:ring-0 py-1.5 px-0 text-[13px] text-slate-800 placeholder-slate-400 leading-relaxed outline-none"
              rows={1}
            />
            <motion.button 
              type="submit"
              whileHover={input.trim() && !isLoading ? { scale: 1.1 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.9 } : {}}
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-full shrink-0 mb-0.5 transition-all outline-none",
                input.trim() && !isLoading ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-300"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </motion.div>

  );
}
