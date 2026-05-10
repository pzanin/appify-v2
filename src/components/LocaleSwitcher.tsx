import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LOCALES } from '../constants';
import { ToastType } from '../types';

interface LocaleSwitcherProps {
  showToast: (msg: string, type?: ToastType) => void;
}

export function LocaleSwitcher({ showToast }: LocaleSwitcherProps) {
  const activeLocaleCode = useAppStore(state => state.activeLocale);
  const setLocale = useAppStore(state => state.setLocale);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLocale = SUPPORTED_LOCALES.find(l => l.code === activeLocaleCode) || SUPPORTED_LOCALES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: typeof SUPPORTED_LOCALES[number]['code'], label: string) => {
    setLocale(code);
    showToast(`Idioma alterado para ${label}`, 'success');
    setIsOpen(false);
  };

  return (
    <div className="locale-switcher-wrapper" style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn-ghost" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          minWidth: '90px', 
          height: '36px', 
          padding: '0 12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '8px',
          borderRadius: '8px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span>{activeLocale.flag}</span>
          <span style={{ fontWeight: 600 }}>{activeLocale.code.split('-')[0].toUpperCase()}</span>
        </span>
        <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          zIndex: 200,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
          minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 0.2s ease'
        }}>
          {SUPPORTED_LOCALES.map((locale) => (
            <div 
              key={locale.code}
              onClick={() => handleSelect(locale.code, locale.label)}
              style={{
                padding: '10px 14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                fontSize: '13px',
                cursor: 'pointer',
                background: locale.code === activeLocaleCode ? 'var(--accent-glow)' : 'transparent',
                color: locale.code === activeLocaleCode ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.15s'
              }}
              className="locale-option"
            >
              <span>{locale.flag}</span>
              <span style={{ flex: 1 }}>{locale.label}</span>
              {locale.code === activeLocaleCode && <Check size={14} />}
            </div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .locale-option:hover { background: var(--surface2) !important; color: var(--text) !important; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
