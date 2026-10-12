import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { Message, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import ThinkingSection from './ThinkingSection';
import TypewriterMarkdown from '../TypewriterMarkdown';
import UserAvatar from '../UserAvatar';

interface ChatMessageItemProps {
  message: Message;
  isGenerating: boolean;
  userProfile?: UserProfile | null;
  onRetry?: (message: Message) => void;
}

export default function ChatMessageItem({
  message,
  isGenerating,
  userProfile,
  onRetry,
}: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
        mass: 0.8,
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 },
      }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className="flex gap-3 max-w-[95%] xl:max-w-[85%]">
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        <div
          className={cn(
            'px-4 py-3 shadow-xs text-[13px] sm:text-sm min-w-0 break-words overflow-hidden',
            isUser
              ? 'bg-slate-900 text-white rounded-2xl rounded-tr-xs'
              : 'bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-tl-xs'
          )}
        >
          {/* Attached images preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {message.attachments.map((att, aIdx) => (
                <div
                  key={aIdx}
                  className="relative rounded-xl overflow-hidden border border-white/20 bg-black/10 shadow-sm max-w-[260px]"
                >
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

          {/* Collapsible reasoning / thought process */}
          {!isUser && message.thinking && (
            <ThinkingSection
              thinking={message.thinking}
              isGenerating={isGenerating}
            />
          )}

          {/* Message Content */}
          {!isUser ? (
            <div className="w-full text-slate-800">
              <TypewriterMarkdown
                text={message.text}
                isGenerating={isGenerating}
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}

          {/* Token & Status Indicator */}
          {isUser && (
            <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] select-none">
              {message.status === 'sending' && (
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" />
                  পাঠানো হচ্ছে...
                </span>
              )}
              {message.status === 'error' && (
                <div className="flex items-center gap-2 text-rose-300 font-medium">
                  <span>পাঠানো যায়নি</span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 hover:bg-rose-500/40 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      আবার পাঠান
                    </button>
                  )}
                </div>
              )}
              {(!message.status || message.status === 'sent') && message.text && (
                <span className="text-zinc-400 font-mono">
                  ~{Math.max(25, Math.round(message.text.length * 1.4))} tokens
                </span>
              )}
            </div>
          )}

          {!isUser && message.text && (
            <span className="block mt-1.5 text-[10px] font-mono tracking-tight text-zinc-500">
              ~{Math.max(25, Math.round(message.text.length * 1.4))} tokens
            </span>
          )}
        </div>

        {isUser && (
          <UserAvatar
            name={userProfile?.fullName || userProfile?.username || 'User'}
            avatarIndex={userProfile?.avatarIndex || 0}
            size="sm"
          />
        )}
      </div>
    </motion.div>
  );
}
