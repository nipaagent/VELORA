import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MenuSlide({ isOpen, onClose, children }: Props) {
  return (
    <AnimatePresence>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col pointer-events-none"
      )}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 pointer-events-auto"
            onClick={onClose}
          />
        )}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: isOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-52 bg-white text-gray-900 flex flex-col shadow-xl border-r border-gray-100 pointer-events-auto"
          )}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
