import React, { useState } from 'react';
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
      <code className="bg-slate-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-md font-mono border border-slate-200 font-medium" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-slate-800 bg-[#181825] shadow-md max-w-full">
      <div className="bg-[#11111b] px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="uppercase text-[11px] font-bold text-indigo-400 tracking-wider">{lang || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-sans text-xs font-medium"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#1e1e2e] text-slate-100 text-xs sm:text-sm font-mono leading-relaxed">
        <pre className="whitespace-pre">
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  );
}

export default function TypewriterMarkdown({ text, isLatest }: TypewriterMarkdownProps) {
  return (
    <div className="relative markdown-body selection:bg-indigo-100 selection:text-indigo-900">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-800 font-normal">{children}</p>,
          h1: ({ children }: any) => <h1 className="text-xl font-bold text-slate-900 mb-4 mt-2 tracking-tight">{children}</h1>,
          h2: ({ children }: any) => <h2 className="text-lg font-bold text-slate-900 mb-3 mt-3 tracking-tight border-b border-slate-100 pb-1">{children}</h2>,
          h3: ({ children }: any) => <h3 className="text-base font-semibold text-slate-900 mb-2 mt-2 tracking-tight">{children}</h3>,
          ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 mb-3 text-slate-800">{children}</ul>,
          ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-slate-800">{children}</ol>,
          li: ({ children }: any) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/40 px-4 py-2.5 rounded-r-lg my-3 text-slate-700 italic">
              {children}
            </blockquote>
          ),
          img: ({ src, alt, ...props }: any) => (
            <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 max-w-full">
              <img 
                src={src} 
                alt={alt || "Generated Image"} 
                className="w-full h-auto max-h-[500px] object-contain rounded-2xl"
                loading="lazy"
                {...props} 
              />
            </div>
          )
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
