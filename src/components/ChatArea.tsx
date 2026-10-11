import React, { useState, useRef, useEffect } from 'react';
import { Chat, UserProfile } from '../types';
import ChatMessagesList from './chat/ChatMessagesList';
import ChatInput from './chat/ChatInput';

interface ChatAreaProps {
  chat: Chat | undefined | null;
  onSendMessage: (text: string, attachments?: any[]) => void;
  onNewChat?: () => void;
  isLoading: boolean;
  userProfile?: UserProfile | null;
}

export default function ChatArea({
  chat,
  onSendMessage,
  isLoading,
  userProfile,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

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
    const hasText = Boolean(input.trim());
    const hasAtts = attachments.length > 0;
    if ((!hasText && !hasAtts) || isLoading) return;

    setIsAutoScrollEnabled(true);
    const messageText = hasText
      ? input.trim()
      : hasAtts
      ? 'এই ছবিটি বিশ্লেষণ করে বিস্তারিত ব্যাখ্যা দিন।'
      : '';

    onSendMessage(messageText, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
  };

  const messages = chat?.messages || [];

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
      {/* Messages Scroll View */}
      <ChatMessagesList
        messages={messages}
        isLoading={isLoading}
        userProfile={userProfile}
        scrollContainerRef={scrollContainerRef}
        messagesEndRef={messagesEndRef}
        onScroll={handleScroll}
      />

      {/* Floating Bottom Input Box Area */}
      <ChatInput
        input={input}
        setInput={setInput}
        attachments={attachments}
        setAttachments={setAttachments}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        userProfile={userProfile}
      />
    </div>
  );
}
