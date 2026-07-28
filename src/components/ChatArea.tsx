import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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

export default function ChatArea({ chat, onSendMessage, onNewChat, isLoading }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const messages = chat?.messages || [];

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <MessageAppear>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm mx-auto">
                <Bot className="w-6 h-6 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 tracking-tight">How can I help you today?</h2>
            </MessageAppear>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 w-full pb-4">
            {messages.map((msg, idx) => (
              <MessageAppear 
                key={msg.id} 
                isUser={msg.role === 'user'}
                className={cn(
                  "flex w-full",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className="flex gap-3 max-w-full min-w-0">
                  {msg.role === 'model' && (
                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-gray-700" />
                    </div>
                  )}
                  
                  <div 
                    className={cn(
                      "max-w-[88%] sm:max-w-[82%] px-4 py-3 shadow-sm text-[13px] sm:text-sm min-w-0 break-words overflow-hidden",
                      msg.role === 'user' 
                        ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white border border-gray-200/80 text-gray-800 rounded-2xl rounded-tl-sm'
                    )}
                  >
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:m-0 prose-pre:p-0 prose-pre:bg-transparent">
                        <TypewriterMarkdown text={msg.text} isLatest={idx === messages.length - 1} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User className="w-3.5 h-3.5 text-gray-700" />
                    </div>
                  )}
                </div>
              </MessageAppear>
            ))}
            {isLoading && (
              <MessageAppear className="flex w-full justify-start">
                <div className="flex gap-3 max-w-full">
                  <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-gray-700" />
                  </div>
                  <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                    <TypingIndicator />
                  </div>
                </div>
              </MessageAppear>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="p-3 sm:pb-4 sm:px-6 bg-gradient-to-t from-white via-white/90 to-transparent shrink-0">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 transition-all border border-gray-200/90 shadow-lg shadow-gray-200/50 hover:border-gray-300 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:shadow-xl"
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
              placeholder="Type a message..."
              className="flex-1 max-h-32 min-h-[36px] bg-transparent resize-none border-0 focus:ring-0 py-1.5 px-0 text-[13px] text-gray-800 placeholder-gray-400 leading-relaxed outline-none"
              rows={1}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-full shrink-0 mb-0.5 transition-all outline-none",
                input.trim() && !isLoading ? "bg-gray-900 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-md" : "bg-transparent text-gray-300"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
