import React from 'react';

interface Props {
  children: React.ReactNode;
  isUser?: boolean;
  className?: string;
}

export default function MessageAppear({ children, className }: Props) {
  return (
    <div className={`transition-all duration-200 ease-out ${className || ''}`}>
      {children}
    </div>
  );
}
