// components/ui/NeoButton.tsx
import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  variant?: 'default' | 'primary';
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  isActive, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-medium transition-all duration-200 ease-in-out flex items-center justify-center gap-2 w-full";
  
  // Colors tailored to match the lavender/purple hue of the reference UI
  const bgColors = variant === 'primary' ? 'bg-[#fced68] text-slate-800' : 'bg-[#E5E9FA] text-[#5A607F]';
  
  // Neumorphic shadow logic: switches to inset on active/hover
  const outShadow = variant === 'primary' 
    ? 'shadow-[4px_4px_8px_#d6c958,-4px_-4px_8px_#ffff78]'
    : 'shadow-[6px_6px_12px_#c6cbe6,-6px_-6px_12px_#ffffff]';
    
  const insetShadow = variant === 'primary'
    ? 'shadow-[inset_4px_4px_8px_#d6c958,inset_-4px_-4px_8px_#ffff78]'
    : 'shadow-[inset_4px_4px_8px_#c6cbe6,inset_-4px_-4px_8px_#ffffff]';

  const shadows = isActive 
    ? insetShadow 
    : `${outShadow} hover:${insetShadow}`;

  return (
    <button className={`${baseStyle} ${bgColors} ${shadows} ${className}`} {...props}>
      {children}
    </button>
  );
};