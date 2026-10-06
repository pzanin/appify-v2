import React from 'react';
import { motion } from 'motion/react';
import type { EntryAnimation as EntryAnimationType } from '../types';

interface EntryAnimationProps {
  animation?: EntryAnimationType;
  durationMs?: number;
  delayMs?: number;
  once?: boolean;
  children: React.ReactNode;
}

const variants: Record<Exclude<EntryAnimationType, 'none'>, { initial: Record<string, number>; animate: Record<string, number> }> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  'fade-up': { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
  'fade-down': { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 } },
  'slide-left': { initial: { opacity: 0, x: 36 }, animate: { opacity: 1, x: 0 } },
  'slide-right': { initial: { opacity: 0, x: -36 }, animate: { opacity: 1, x: 0 } },
  zoom: { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 } },
};

export function EntryAnimation({
  animation = 'none',
  durationMs = 500,
  delayMs = 0,
  once = true,
  children,
}: EntryAnimationProps) {
  if (animation === 'none') return <>{children}</>;

  const preset = variants[animation];
  return (
    <motion.div
      initial={preset.initial}
      whileInView={preset.animate}
      viewport={{ once, amount: 0.18 }}
      transition={{ duration: Math.max(durationMs, 0) / 1000, delay: Math.max(delayMs, 0) / 1000, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
