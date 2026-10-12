export interface LessonCelebrationGlobalConfig {
  enabled?: boolean;
  enableCelebration?: boolean;
}

export interface LessonCelebrationOverride {
  enableCelebration?: boolean;
}

export function shouldCelebrateLesson(
  gamification: LessonCelebrationGlobalConfig | null | undefined,
  lessonConfig: LessonCelebrationOverride | null | undefined
) {
  if (!gamification?.enabled) return false;
  if (typeof lessonConfig?.enableCelebration === 'boolean') return lessonConfig.enableCelebration;
  return Boolean(gamification.enableCelebration);
}
