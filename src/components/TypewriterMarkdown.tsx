import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="my-3.5 rounded-xl overflow-hidden border border-gray-800 bg-[#181825] shadow-md max-w-full"
    >
      <div className="bg-[#11111b] px-4 py-2 flex items-center justify-between border-b border-gray-800/80 text-xs text-gray-400 font-mono">
        <span className="uppercase text-[11px] font-bold text-indigo-400 tracking-wider">{lang || 'CODE'}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#1e1e2e] text-gray-100 text-xs sm:text-sm font-mono leading-relaxed">
        <pre className="whitespace-pre">
          <code>{codeString}</code>
        </pre>
      </div>
    </motion.div>
  );
}

export default function TypewriterMarkdown({ text, isLatest }: TypewriterMarkdownProps) {
  return (
    <div className="relative markdown-body selection:bg-indigo-100 selection:text-indigo-900">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          p: ({ children }: any) => <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 last:mb-0 leading-relaxed text-slate-700 font-medium">{children}</motion.p>,
          h1: ({ children }: any) => <motion.h1 initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-black text-slate-900 mb-6 mt-2 tracking-tight">{children}</motion.h1>,
          h2: ({ children }: any) => <motion.h2 initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-xl font-black text-slate-900 mb-5 mt-4 tracking-tight border-b border-slate-100 pb-2">{children}</motion.h2>,
          h3: ({ children }: any) => <motion.h3 initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-lg font-bold text-slate-900 mb-4 mt-3 tracking-tight">{children}</motion.h3>,
          ul: ({ children }: any) => <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="list-disc pl-5 space-y-2 mb-4 text-slate-700 font-medium">{children}</motion.ul>,
          ol: ({ children }: any) => <motion.ol initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="list-decimal pl-5 space-y-2 mb-4 text-slate-700 font-medium">{children}</motion.ol>,
          li: ({ children }: any) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }: any) => (
            <motion.blockquote 
              initial={{ opacity: 0, borderLeftWidth: 0 }} 
              animate={{ opacity: 1, borderLeftWidth: 4 }} 
              className="border-l-4 border-indigo-500 bg-indigo-50/30 px-5 py-3 rounded-r-xl my-4 text-slate-600 font-medium italic italic-none"
            >
              {children}
            </motion.blockquote>
          ),
          img: ({ src, alt, ...props }: any) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-3 rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm bg-gray-50 max-w-full"
            >
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
            </motion.div>
          )
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
