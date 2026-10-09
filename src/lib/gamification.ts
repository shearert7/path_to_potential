import { StudyLog, StreakInfo, MedalTier } from '../types';
import confetti from 'canvas-confetti';

export interface WeekPerformance {
  termNumber: number;
  weekNumber: number;
  hours: number;
  goal: number;
  achieved: boolean;
  percent: number;
}

/**
 * Evaluates a student's study logs and computes weekly streaks and unlocked medals
 * - Bronze: 3-week streak of meeting weekly study target
 * - Silver: 5-week streak of meeting weekly study target
 * - Gold: 7-week streak of meeting weekly study target
 */
export function calculateStreakAndMedals(
  logs: StudyLog[],
  weeklyGoal: number,
  currentTerm: number = 3,
  currentWeek: number = 6
): StreakInfo & { weeklyPerformances: WeekPerformance[] } {
  // Aggregate hours by term and week
  const weekMap: Record<string, number> = {};

  logs.forEach((log) => {
    const key = `t${log.termNumber}-w${log.weekNumber}`;
    weekMap[key] = (weekMap[key] || 0) + (log.durationMinutes || 0) / 60;
  });

  // Build ordered list of past and current weeks
  // (from Term 1 Week 1 through currentTerm and currentWeek)
  const performances: WeekPerformance[] = [];

  for (let t = 1; t <= currentTerm; t++) {
    const maxWeeks = t < currentTerm ? 10 : currentWeek;
    for (let w = 1; w <= maxWeeks; w++) {
      const key = `t${t}-w${w}`;
      const hours = Math.round((weekMap[key] || 0) * 10) / 10;
      // Met if hours >= weeklyGoal or at least 95% of goal
      const achieved = hours >= Math.max(1, weeklyGoal * 0.95);
      const percent = Math.round((hours / Math.max(1, weeklyGoal)) * 100);

      performances.push({
        termNumber: t,
        weekNumber: w,
        hours,
        goal: weeklyGoal,
        achieved,
        percent,
      });
    }
  }

  // Calculate current streak (working backwards from current week)
  let currentStreak = 0;
  for (let i = performances.length - 1; i >= 0; i--) {
    if (performances[i].achieved) {
      currentStreak++;
    } else {
      // If it's the current active week and week isn't finished yet, don't break immediately
      // unless total is zero and week started. But if previous week was achieved, keep counting
      if (i === performances.length - 1 && performances[i].hours === 0) {
        continue;
      }
      break;
    }
  }

  // Calculate longest streak across all recorded weeks
  let longestStreak = 0;
  let tempStreak = 0;

  for (const perf of performances) {
    if (perf.achieved) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // At least currentStreak is candidate for longestStreak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Medals unlocked based on longest streak
  const medals = {
    bronze: longestStreak >= 3,
    silver: longestStreak >= 5,
    gold: longestStreak >= 7,
  };

  // Next milestone calculation
  let targetStreak = 3;
  let medal: 'bronze' | 'silver' | 'gold' | 'legend' = 'bronze';

  if (currentStreak < 3) {
    targetStreak = 3;
    medal = 'bronze';
  } else if (currentStreak < 5) {
    targetStreak = 5;
    medal = 'silver';
  } else if (currentStreak < 7) {
    targetStreak = 7;
    medal = 'gold';
  } else {
    targetStreak = 10;
    medal = 'legend';
  }

  const remainingWeeks = Math.max(0, targetStreak - currentStreak);
  const progressPercent = Math.min(100, Math.round((currentStreak / targetStreak) * 100));

  return {
    currentStreak,
    longestStreak,
    medals,
    nextMilestone: {
      targetStreak,
      medal,
      remainingWeeks,
      progressPercent,
    },
    weeklyPerformances: performances,
  };
}

export function triggerStreakCelebration(medalTier: MedalTier) {
  let colors = ['#D4AF37', '#CD7F32', '#4A154B'];
  if (medalTier === 'bronze') colors = ['#CD7F32', '#A0522D', '#D4AF37'];
  if (medalTier === 'silver') colors = ['#C0C0C0', '#E5E7EB', '#4A154B'];
  if (medalTier === 'gold') colors = ['#D4AF37', '#FFD700', '#F59E0B', '#4A154B'];

  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.6 },
    colors,
  });
}
