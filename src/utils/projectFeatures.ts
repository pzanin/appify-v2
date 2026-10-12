import { PIPELINE_STEPS } from '../constants';
import { PwaConfig } from '../types';

// Existing projects keep engagement until their owner explicitly disables it.
export const engagementIsEnabled = (config: PwaConfig) => config.engagementEnabled !== false;
export const visibleProjectSteps = (config: PwaConfig) => PIPELINE_STEPS.filter(step =>
  (step.id !== 4 || engagementIsEnabled(config)) && (step.id !== 6 || config.gamification?.enabled));

// Export disabled child features defensively without erasing the editor settings.
export function publicFeatureConfig(config: PwaConfig): PwaConfig {
  const backendEnabled = config.backendProvider === 'supabase';
  const publicKey = config.supabasePublishableKey || config.supabaseAnonKey || '';
  const safeBackendConfig: PwaConfig = backendEnabled
    ? { ...config, supabasePublishableKey: publicKey, supabaseAnonKey: '' }
    : { ...config, backendProvider: 'none', supabaseUrl: '', supabasePublishableKey: '', supabaseAnonKey: '' };

  if (safeBackendConfig.gamification?.enabled) return safeBackendConfig;
  return { ...safeBackendConfig, gamification: { ...safeBackendConfig.gamification, enabled: false,
    progressStyle: 'none', enableStreaks: false, enableCelebration: false,
    enablePoints: false, enableBadges: false, awardsConfig: [] } };
}
