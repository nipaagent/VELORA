import React from 'react';
import { Bot, Sparkles, Image as ImageIcon, Code, Zap } from 'lucide-react';

export default function ChatEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm mx-auto">
        <Bot className="w-8 h-8 text-slate-800" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5 flex items-center gap-2 justify-center">
        Nipa Assistant
        <Sparkles className="w-4 h-4 text-amber-500" />
      </h2>
      <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
        High-performance technical AI ready to write code, analyze images, answer queries, and generate graphics.
      </p>

      {/* Suggested Quick Starters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-md w-full px-2">
        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-left flex items-center gap-2.5 text-xs text-slate-600">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
            <Code className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Write a TypeScript API endpoint"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-left flex items-center gap-2.5 text-xs text-slate-600">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Upload image to analyze"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-left flex items-center gap-2.5 text-xs text-slate-600">
          <div className="p-1.5 rounded-lg bg-violet-100 text-violet-600 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"একটি সুন্দর প্রাকৃতিক দৃশ্য আঁকো"</span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-left flex items-center gap-2.5 text-xs text-slate-600">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">"Ultra-fast Q&A mode"</span>
        </div>
      </div>
    </div>
  );
}
