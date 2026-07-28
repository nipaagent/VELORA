import React from 'react';
import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  isUser?: boolean;
  className?: string;
}

export default function MessageAppear({ children, isUser = false, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1],
        scale: { type: 'spring', stiffness: 200, damping: 20 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
