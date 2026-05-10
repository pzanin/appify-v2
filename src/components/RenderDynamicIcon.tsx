import React from 'react';
import { ICON_MAP } from '../constants';
import { BookOpen, LucideProps } from 'lucide-react';

export function RenderDynamicIcon({ name, ...props }: LucideProps & { name: string }) {
  const IconComp = (Object.prototype.hasOwnProperty.call(ICON_MAP, name) ? ICON_MAP[name] : null) || BookOpen;
  return <IconComp {...props} />;
}
