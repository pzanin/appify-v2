import React from 'react';

export const AppifyLogo = ({ className = "text-2xl" }: { className?: string }) => (
  <div 
    className={`font-black tracking-tighter flex items-center select-none ${className}`} 
    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
  >
    <span className="text-[var(--text-primary)]">App</span>
    <span className="text-[#6338F6]">ify</span>
  </div>
);
