// components/ui/NeoCard.tsx
import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const NeoCard: React.FC<NeoCardProps> = ({ children, className = '', padding = 'p-6' }) => {
  return (
    <div className={`bg-[#E5E9FA] rounded-3xl shadow-[8px_8px_16px_#c6cbe6,-8px_-8px_16px_#ffffff] ${padding} ${className}`}>
      {children}
    </div>
  );
};

