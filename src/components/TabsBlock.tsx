import React, { useState } from 'react';
import type { TabItem } from '../types';

interface TabsBlockProps {
  tabs: TabItem[];
  initialIndex?: number;
  accentColor?: string;
  textColor?: string;
  background?: string;
  borderRadius?: number;
}

export function TabsBlock({
  tabs,
  initialIndex = 0,
  accentColor = '#6b8af0',
  textColor = '#1f2937',
  background = '#ffffff',
  borderRadius = 10,
}: TabsBlockProps) {
  const [activeIndex, setActiveIndex] = useState(Math.min(Math.max(initialIndex, 0), Math.max(tabs.length - 1, 0)));
  const active = tabs[activeIndex];

  if (!tabs.length) return null;

  return (
    <div style={{ background, border: '1px solid rgba(127,127,127,.22)', borderRadius, overflow: 'hidden' }}>
      <div role="tablist" style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: 6, borderBottom: '1px solid rgba(127,127,127,.18)' }}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIndex(index)}
              style={{ border: 0, borderRadius: 7, padding: '10px 14px', background: isActive ? accentColor : 'transparent', color: isActive ? '#fff' : textColor, font: 'inherit', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" style={{ padding: 18, color: textColor, lineHeight: 1.65 }}>
        {active?.content}
      </div>
    </div>
  );
}
