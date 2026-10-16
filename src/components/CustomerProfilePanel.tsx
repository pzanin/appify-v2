import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, User, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PwaConfig } from '../types';
import { customerProfileStorageKey, readCustomerProfile, resetCustomerProductData, writeCustomerProfile } from '../utils/customerStorage';

type PreviewProfile = { name: string; email: string; updatedAt: number };
type PreviewProfileProjectsApi = {
  readPreviewProfile?: (id: number) => Promise<PreviewProfile>;
  writePreviewProfile?: (id: number, profile: { name: string; email: string }) => Promise<PreviewProfile>;
};

function previewProfileApi() {
  return window.appifyDesktop?.projects as typeof window.appifyDesktop.projects & PreviewProfileProjectsApi | undefined;
}

export function CustomerProfilePanel({
  config,
  projectId,
  preview,
  dark,
  themeColor,
  onResetPreview,
}: {
  config: PwaConfig;
  projectId: number | null;
  preview: boolean;
  dark: boolean;
  themeColor: string;
  onResetPreview?: () => void;
}) {
  const { i18n } = useTranslation();
  const language = config.language || 'pt-BR';
  const t = i18n.getFixedT(language.split('-')[0]);
  const storageKey = useMemo(() => customerProfileStorageKey(config, preview, projectId), [config.productId, config.appName, preview, projectId]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const desktop = preview && projectId ? previewProfileApi() : undefined;
        const profile = desktop?.readPreviewProfile
          ? await desktop.readPreviewProfile(projectId!)
          : readCustomerProfile(window.localStorage, storageKey);
        if (cancelled) return;
        setName(profile.name);
        setEmail(profile.email);
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [preview, projectId, storageKey]);

  const resetPreview = async () => {
    if (!preview || !onResetPreview) return;
    try {
      const desktop = projectId ? previewProfileApi() : undefined;
      if (desktop?.writePreviewProfile && projectId) await desktop.writePreviewProfile(projectId, { name: '', email: '' });
      resetCustomerProductData(window.localStorage, config, true, projectId);
      setName('');
      setEmail('');
      setStatus('idle');
      window.dispatchEvent(new window.StorageEvent('storage', { key: null }));
      onResetPreview();
    } catch {
      setStatus('error');
    }
  };

  const save = async () => {
    try {
      const desktop = preview && projectId ? previewProfileApi() : undefined;
      const confirmed = desktop?.writePreviewProfile
        ? await desktop.writePreviewProfile(projectId!, { name, email })
        : (() => {
            const written = writeCustomerProfile(window.localStorage, storageKey, { name, email });
            const reread = readCustomerProfile(window.localStorage, storageKey);
            if (reread.name !== written.name || reread.email !== written.email || reread.updatedAt !== written.updatedAt) {
              throw new Error('Customer profile storage verification failed');
            }
            return reread;
          })();
      setName(confirmed.name);
      setEmail(confirmed.email);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center custom-scrollbar px-6 pt-8 pb-32">
      <div className={`text-2xl font-black mb-8 self-start ${dark ? 'text-white' : 'text-gray-900'}`}>{t('app.profile.title')}</div>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 mb-8 ${dark ? 'bg-gray-800 border-white/5' : 'bg-white border-black/5 shadow-sm'}`} style={{ color: themeColor }} aria-label={t('app.profile.title')}>
        <User size={40} />
      </div>
      <div className="w-full space-y-4 mb-4">
        <input
          type="text"
          autoComplete="name"
          maxLength={120}
          className={`w-full p-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-[var(--dynamic-theme)] ${dark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700 shadow-sm border border-black/5'}`}
          value={name}
          onChange={event => { setName(event.target.value); setStatus('idle'); }}
          placeholder={t('app.profile.namePlaceholder')}
        />
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          className={`w-full p-4 rounded-2xl text-sm font-bold border outline-none transition-all focus:ring-2 focus:ring-[var(--dynamic-theme)] ${dark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-black/5 text-gray-700 shadow-sm'}`}
          value={email}
          onChange={event => { setEmail(event.target.value); setStatus('idle'); }}
          placeholder={t('app.profile.emailPlaceholder')}
        />
      </div>
      <p className={`w-full text-xs leading-relaxed mb-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t('app.profile.localNote')}</p>
      <button type="button" onClick={() => { void save(); }} className="w-full py-5 rounded-2xl font-black text-white shadow-2xl transition-transform active:scale-95" style={{ background: themeColor, boxShadow: `0 12px 24px ${themeColor}44` }}>
        {status === 'saved' ? t('app.profile.saved') : t('app.profile.saveButton')}
      </button>
      {status !== 'idle' && (
        <div role={status === 'error' ? 'alert' : 'status'} className={`w-full flex items-center gap-2 rounded-2xl px-4 py-3 mt-4 text-sm font-bold ${status === 'saved' ? (dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700') : (dark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700')}`}>
          {status === 'saved' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{status === 'saved' ? t('app.profile.saved') : t('app.profile.saveError')}</span>
        </div>
      )}
      {preview && onResetPreview && (
        <div className={`w-full mt-8 pt-5 border-t ${dark ? 'border-white/10' : 'border-black/10'}`}>
          <p className={`text-xs leading-relaxed mb-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t('app.profile.resetPreviewNote')}</p>
          <button type="button" onClick={() => { void resetPreview(); }} className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border ${dark ? 'border-red-400/30 text-red-300 bg-red-500/5' : 'border-red-200 text-red-700 bg-red-50'}`}>
            <RotateCcw size={17} /> {t('app.profile.resetPreview')}
          </button>
        </div>
      )}
    </div>
  );
}
