import React from 'react';
import { Bot, Sparkles, Image as ImageIcon, Code, Zap } from 'lucide-react';

export default function ChatEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-sm mx-auto text-white">
        <Bot className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-1.5 flex items-center gap-2 justify-center">
        NIPA Assistant
        <Sparkles className="w-4 h-4 text-zinc-900" />
      </h2>
      <p className="text-xs font-medium text-zinc-500 max-w-sm mx-auto leading-relaxed">
        High-performance technical AI ready to write code, analyze images, answer queries, and generate graphics.
      </p>

      {/* Suggested Quick Starters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-md w-full px-2">
        <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-left flex items-center gap-2.5 text-xs text-zinc-700">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shrink-0">
            <Code className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Write a TypeScript API endpoint"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-left flex items-center gap-2.5 text-xs text-zinc-700">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Upload image to analyze"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-left flex items-center gap-2.5 text-xs text-zinc-700">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"একটি সুন্দর প্রাকৃতিক দৃশ্য আঁকো"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-left flex items-center gap-2.5 text-xs text-zinc-700">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Ultra-fast Q&A mode"</span>
        </div>
      </div>
    </div>
  );
}
