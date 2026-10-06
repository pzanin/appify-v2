import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Bell, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTranslation } from 'react-i18next';

const INSTALL_PROMPT_KEY = 'appify_has_seen_install_prompt';
const PUSH_PROMPT_KEY = 'appify_has_seen_push_prompt';

export function OnboardingFlow() {
  const { t } = useTranslation();
  const { isInstallAvailable, isIOS, isStandalone, triggerInstall } = usePWAInstall();

  const [hasSeenInstallPrompt, setHasSeenInstallPromptState] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(INSTALL_PROMPT_KEY) === '1'
  );
  const [hasSeenPushPrompt, setHasSeenPushPromptState] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(PUSH_PROMPT_KEY) === '1'
  );
  const [step, setStep] = useState<'install' | 'push' | null>(null);

  const setHasSeenInstallPrompt = (value: boolean) => {
    setHasSeenInstallPromptState(value);
    if (typeof window !== 'undefined') localStorage.setItem(INSTALL_PROMPT_KEY, value ? '1' : '0');
  };

  const setHasSeenPushPrompt = (value: boolean) => {
    setHasSeenPushPromptState(value);
    if (typeof window !== 'undefined') localStorage.setItem(PUSH_PROMPT_KEY, value ? '1' : '0');
  };

  useEffect(() => {
    if (isStandalone) {
      setHasSeenInstallPrompt(true);
      if (!hasSeenPushPrompt) setStep('push');
    } else if (!hasSeenInstallPrompt) {
      setStep('install');
    } else if (!hasSeenPushPrompt) {
      setStep('push');
    }
  }, [hasSeenInstallPrompt, hasSeenPushPrompt, isStandalone]);

  const handleDismissInstall = () => {
    setHasSeenInstallPrompt(true);
    if (!hasSeenPushPrompt) setStep('push');
    else setStep(null);
  };

  const handleDismissPush = () => {
    setHasSeenPushPrompt(true);
    setStep(null);
  };

  const handleInstall = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'accepted') handleDismissInstall();
  };

  const handleEnablePush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') console.log('Push notifications enabled');
    }
    handleDismissPush();
  };

  if (!step) return null;

  return (
    <AnimatePresence>
      <div className="onboarding-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="onboarding-card"
          style={{
            background: 'var(--surface)', width: '100%', maxWidth: '400px',
            borderRadius: '28px', padding: '40px 32px', textAlign: 'center',
            position: 'relative', overflow: 'hidden', border: '1px solid var(--border)'
          }}
        >
          <div style={{
            position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '200px', background: 'var(--accent)',
            filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none'
          }} />

          {step === 'install' ? (
            <div key="step-install">
              <div style={{
                width: '80px', height: '80px', background: 'var(--accent-glow)',
                borderRadius: '24px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 32px', color: 'var(--accent)'
              }}>
                <Download size={40} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
                {t('onboarding.install.title', 'Instalar App')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '40px' }}>
                {t('onboarding.install.subtitle', 'Adicione nosso app à sua tela inicial para uma experiência premium e acesso instantâneo.')}
              </p>

              {isIOS ? (
                <div style={{
                  background: 'var(--surface2)', padding: '20px', borderRadius: '20px',
                  textAlign: 'left', marginBottom: '32px', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Share size={14} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('onboarding.install.iosStep1', '1. Toque no ícone de Compartilhar')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={14} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('onboarding.install.iosStep2', '2. Selecione "Adicionar à Tela de Início"')}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={!isInstallAvailable}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '18px', borderRadius: '18px',
                    marginBottom: '12px', fontSize: '16px', fontWeight: 700,
                    opacity: isInstallAvailable ? 1 : 0.5
                  }}
                >
                  {t('onboarding.install.confirm', 'Instalar Agora')}
                </button>
              )}

              <button
                onClick={handleDismissInstall}
                style={{
                  background: 'transparent', color: 'var(--muted)', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {t('onboarding.install.skip', 'Agora Não')}
              </button>
            </div>
          ) : (
            <div key="step-push">
              <div style={{
                width: '80px', height: '80px', background: 'var(--accent-glow)',
                borderRadius: '24px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 32px', color: 'var(--accent)'
              }}>
                <Bell size={40} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
                {t('onboarding.push.title', 'Notificações')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '40px' }}>
                {t('onboarding.push.subtitle', 'Ative as notificações para receber lembretes de aulas, novidades e conteúdos exclusivos em tempo real.')}
              </p>

              <button
                onClick={handleEnablePush}
                className="btn-primary"
                style={{
                  width: '100%', padding: '18px', borderRadius: '18px',
                  marginBottom: '12px', fontSize: '16px', fontWeight: 700
                }}
              >
                {t('onboarding.push.confirm', 'Ativar Notificações')}
              </button>

              <button
                onClick={handleDismissPush}
                style={{
                  background: 'transparent', color: 'var(--muted)', border: 'none',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {t('onboarding.push.skip', 'Agora Não')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
