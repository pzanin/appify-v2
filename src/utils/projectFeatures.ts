import { PIPELINE_STEPS } from '../constants';
import { PwaConfig } from '../types';

// Existing projects keep engagement until their owner explicitly disables it.
export const engagementIsEnabled = (config: PwaConfig) => config.engagementEnabled !== false;
export const visibleProjectSteps = (config: PwaConfig) => PIPELINE_STEPS.filter(step =>
  (step.id !== 4 || engagementIsEnabled(config)) && (step.id !== 6 || config.gamification?.enabled));

// Export disabled child features defensively without erasing the editor settings.
export function publicFeatureConfig(config: PwaConfig): PwaConfig {
  if (config.gamification?.enabled) return config;
  return { ...config, gamification: { ...config.gamification, enabled: false,
    progressStyle: 'none', enableStreaks: false, enableCelebration: false,
    enablePoints: false, enableBadges: false, awardsConfig: [] } };
}
