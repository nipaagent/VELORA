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
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors py-1 group cursor-pointer"
      >
        <BrainCircuit className={cn("w-3.5 h-3.5", isGenerating ? "text-zinc-900 animate-pulse" : "")} />
        <span className="text-xs font-medium">
          {isGenerating ? 'Thinking...' : 'Show thought process'}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      </button>
      
      {isOpen && (
        <div className="mt-2 px-4 py-3 bg-zinc-50 rounded-xl text-[13px] text-zinc-700 leading-relaxed font-sans whitespace-pre-wrap border-l-[3px] border-l-zinc-800">
          {thinking}
        </div>
      )}
    </div>
  );
}
