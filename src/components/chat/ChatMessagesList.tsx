import React from 'react';
import { Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, UserProfile } from '../../types';
import TypingIndicator from '../../animations/TypingIndicator';
import ChatMessageItem from './ChatMessageItem';
import ChatEmptyState from './ChatEmptyState';

interface ChatMessagesListProps {
  messages: Message[];
  isLoading: boolean;
  userProfile?: UserProfile | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onRetry?: (message: Message) => void;
}

export default function ChatMessagesList({
  messages,
  isLoading,
  userProfile,
  scrollContainerRef,
  messagesEndRef,
  onScroll,
  onRetry,
}: ChatMessagesListProps) {
  return (
    <div
      ref={scrollContainerRef as any}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-1 sm:px-2 md:px-3 py-4 sm:py-6 custom-scrollbar"
    >
      {messages.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <div className="w-full max-w-full space-y-5 pb-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isGenerating = isLoading && idx === messages.length - 1;
              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  isGenerating={isGenerating}
                  userProfile={userProfile}
                  onRetry={onRetry}
                />
              );
            })}
          </AnimatePresence>

          {/* Assistant Typing / Processing Indicator */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  filter: 'blur(4px)',
                  transition: { duration: 0.2 },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.2 },
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

          <div ref={messagesEndRef as any} />
        </div>
      )}
    </div>
  );
}
