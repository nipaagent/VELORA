import React, { useRef } from 'react';
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserProfile } from '../../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  userProfile?: UserProfile | null;
}

export default function ChatInput({
  input,
  setInput,
  attachments,
  setAttachments,
  onSubmit,
  isLoading,
  userProfile,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVipActive = Boolean(
    (userProfile?.vipExpiresAt && userProfile.vipExpiresAt > Date.now()) ||
      (userProfile?.isVip && (!userProfile?.vipExpiresAt || userProfile.vipExpiresAt === 0))
  );

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
          setAttachments((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'image',
              url: base64Url,
              name: file.name,
              mimeType: file.type,
            },
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
              setAttachments((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  type: 'image',
                  url: base64Url,
                  name: `pasted-image-${Date.now()}.png`,
                  mimeType: file.type,
                },
              ]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  return (
    <div className="p-3 sm:pb-5 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent shrink-0">
      <div className="w-full max-w-3xl mx-auto relative">
        {/* Generating Indicator Bar */}
        {isLoading && (
          <div className="flex items-center justify-end mb-1.5 px-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn('w-1.5 h-1.5 rounded-full animate-pulse', !isVipActive && 'bg-indigo-600')}
                style={isVipActive ? { backgroundColor: 'var(--user-theme-color)' } : {}}
              />
              <span
                className={cn('text-[10px] font-bold uppercase tracking-wider', !isVipActive && 'text-indigo-600')}
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
              <div
                key={att.id}
                className="relative group rounded-xl border border-indigo-200 bg-indigo-50/80 p-1.5 pr-7 flex items-center gap-2 shadow-xs"
              >
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-9 h-9 object-cover rounded-lg border border-indigo-100"
                />
                <span className="text-xs font-semibold text-slate-700 max-w-[130px] truncate">
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute right-1.5 top-2 p-0.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chat Box Form */}
        <form
          onSubmit={onSubmit}
          onPaste={handlePaste}
          className={cn(
            'flex items-center gap-2 bg-white rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 transition-all',
            isVipActive
              ? 'border-2 shadow-lg focus-within:ring-4'
              : 'border border-slate-200 shadow-md focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/10'
          )}
          style={
            isVipActive
              ? {
                  borderColor: 'var(--user-theme-color)',
                  boxShadow: `0 0 calc(22px * var(--user-theme-glow)) rgba(var(--user-theme-color-rgb), 0.35)`,
                  outlineColor: 'var(--user-theme-color)',
                }
              : {}
          }
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

          {/* Chat Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder="NIPA"
            className="flex-1 max-h-32 min-h-[38px] bg-transparent resize-none border-0 focus:ring-0 py-1.5 px-0 text-sm text-slate-800 placeholder-slate-400 leading-relaxed outline-none custom-scrollbar"
            rows={1}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={cn(
              'p-2 rounded-xl shrink-0 transition-all outline-none',
              (input.trim() || attachments.length > 0) && !isLoading
                ? isVipActive
                  ? 'text-white shadow-md'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
            style={
              isVipActive && (input.trim() || attachments.length > 0) && !isLoading
                ? {
                    backgroundColor: 'var(--user-theme-color)',
                    boxShadow: `0 4px 12px rgba(var(--user-theme-color-rgb), 0.3)`,
                  }
                : {}
            }
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
  );
}
