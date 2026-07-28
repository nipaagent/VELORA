import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  const [seconds, setSeconds] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-700 font-medium select-none">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-4 h-4 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"
      >
        <Sparkles className="w-3 h-3" />
      </motion.div>

      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-gray-800 text-xs tracking-wide">Thinking...</span>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-gray-100 text-indigo-700 rounded-full border border-gray-200/80">
          {seconds}s
        </span>
      </div>

      <div className="flex gap-1 items-center ml-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'loop',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
