import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AccordionItem } from '../types';

interface AccordionBlockProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  accentColor?: string;
  textColor?: string;
  background?: string;
  borderRadius?: number;
}

export function AccordionBlock({
  items,
  allowMultiple = false,
  accentColor = '#6b8af0',
  textColor = '#1f2937',
  background = '#ffffff',
  borderRadius = 10,
}: AccordionBlockProps) {
  const [openIds, setOpenIds] = useState<string[]>(items[0]?.id ? [items[0].id] : []);

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const isOpen = current.includes(id);
      if (allowMultiple) return isOpen ? current.filter((item) => item !== id) : [...current, id];
      return isOpen ? [] : [id];
    });
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} style={{ background, border: '1px solid rgba(127,127,127,.22)', borderRadius, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              style={{ width: '100%', border: 0, background: 'transparent', color: textColor, padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 700 }}
            >
              <span>{item.title}</span>
              <ChevronDown size={18} style={{ color: accentColor, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease', flexShrink: 0 }} />
            </button>
            <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows .25s ease' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 16px 16px', color: textColor, lineHeight: 1.65, opacity: .86 }}>
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
