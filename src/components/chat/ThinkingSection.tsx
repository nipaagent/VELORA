import React, { useState, useEffect } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ThinkingSectionProps {
  thinking: string;
  isGenerating: boolean;
}

export default function ThinkingSection({ thinking, isGenerating }: ThinkingSectionProps) {
  const [isOpen, setIsOpen] = useState(isGenerating);

  useEffect(() => {
    if (isGenerating) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isGenerating]);

  if (!thinking) return null;

  return (
    <div className="mb-3">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors py-1 group cursor-pointer"
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
