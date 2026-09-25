// components/ui/NeoListItem.tsx
export const NeoListItem: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`w-full bg-[#E5E9FA] rounded-xl px-4 py-3 shadow-[inset_3px_3px_6px_#c6cbe6,inset_-3px_-3px_6px_#ffffff] text-sm text-[#5A607F] ${className}`}>
    {children}
  </div>
);