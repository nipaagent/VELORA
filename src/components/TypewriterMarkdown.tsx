import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

interface TypewriterMarkdownProps {
  text: string;
  isLatest: boolean;
}

function CodeBlock({ children, className, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match && !className) {
    return (
      <code className="bg-gray-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-md font-mono border border-gray-200/80 font-medium" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-gray-800 bg-[#181825] shadow-md max-w-full">
      <div className="bg-[#11111b] px-4 py-2 flex items-center justify-between border-b border-gray-800/80 text-xs text-gray-400 font-mono">
        <span className="uppercase text-[11px] font-bold text-indigo-400 tracking-wider">{lang || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white transition-colors font-sans text-xs font-medium"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#1e1e2e] text-gray-100 text-xs sm:text-sm font-mono leading-relaxed">
        <pre className="whitespace-pre">
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  );
}

export default function TypewriterMarkdown({ text, isLatest }: TypewriterMarkdownProps) {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : text);
  const [isTypingComplete, setIsTypingComplete] = useState(!isLatest);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      setIsTypingComplete(true);
      return;
    }

    let currentIndex = 0;
    const step = Math.max(1, Math.ceil(text.length / 80));
    
    const interval = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        setIsTypingComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return (
    <div className="relative">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          img: ({ src, alt, ...props }: any) => (
            <div className="my-3 rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm bg-gray-50 max-w-full">
              <img 
                src={src} 
                alt={alt || "Generated Image"} 
                className="w-full h-auto max-h-[500px] object-contain rounded-2xl hover:opacity-95 transition-opacity"
                loading="lazy"
                {...props} 
              />
              <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-end">
                <a 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View full size ↗
                </a>
              </div>
            </div>
          )
        }}
      >
        {displayedText}
      </ReactMarkdown>

      {!isTypingComplete && (
        <span className="inline-block w-1.5 h-4 bg-indigo-600 animate-pulse ml-0.5 align-middle rounded-full" />
      )}
    </div>
  );
}
