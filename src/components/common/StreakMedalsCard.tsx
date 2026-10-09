import React from 'react';
import { StreakInfo, MedalTier } from '../../types';
import { triggerStreakCelebration } from '../../lib/gamification';
import { Flame, Trophy, Award, Sparkles, Star, ChevronRight } from 'lucide-react';

interface StreakMedalsCardProps {
  streakInfo: StreakInfo;
  variant?: 'compact' | 'full';
}

export const StreakMedalsCard: React.FC<StreakMedalsCardProps> = ({
  streakInfo,
  variant = 'full',
}) => {
  const { currentStreak, longestStreak, medals, nextMilestone } = streakInfo;

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/20 to-purple-50/30 rounded-2xl p-5 shadow-md border border-amber-200/60 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Flame className="w-6 h-6 animate-pulse text-amber-500 fill-amber-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 text-base">
                Weekly Study Streaks & Medals
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Gamified Milestones
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Hit your weekly study goal to unlock official school achievement medals
            </p>
          </div>
        </div>

        {/* Streaks counters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-orange-700 leading-none">Current Streak</div>
              <div className="text-sm font-black text-orange-900 leading-none mt-0.5">
                {currentStreak} {currentStreak === 1 ? 'Week' : 'Weeks'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-purple-700 leading-none">Best Streak</div>
              <div className="text-sm font-black text-[#4A154B] leading-none mt-0.5">
                {longestStreak} {longestStreak === 1 ? 'Week' : 'Weeks'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Medal Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
        {/* Bronze Medal: 3 Weeks */}
        <div
          onClick={() => medals.bronze && triggerStreakCelebration('bronze')}
          className={`p-3.5 rounded-xl border transition relative cursor-pointer ${
            medals.bronze
              ? 'bg-gradient-to-br from-amber-50 to-orange-50/60 border-amber-300 shadow-sm hover:scale-[1.02]'
              : 'bg-slate-50/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Bronze Medal">
                🥉
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  Bronze Medal
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">
                  3-Week Study Streak
                </p>
              </div>
            </div>
            {medals.bronze ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Unlocked! ⭐
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {Math.min(currentStreak, 3)}/3 Wks
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                medals.bronze ? 'bg-amber-600' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((currentStreak / 3) * 100))}%` }}
            />
          </div>
        </div>

        {/* Silver Medal: 5 Weeks */}
        <div
          onClick={() => medals.silver && triggerStreakCelebration('silver')}
          className={`p-3.5 rounded-xl border transition relative cursor-pointer ${
            medals.silver
              ? 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-300 shadow-sm hover:scale-[1.02]'
              : 'bg-slate-50/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Silver Medal">
                🥈
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  Silver Medal
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">
                  5-Week Study Streak
                </p>
              </div>
            </div>
            {medals.silver ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Unlocked! ⭐
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {Math.min(currentStreak, 5)}/5 Wks
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                medals.silver ? 'bg-slate-600' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((currentStreak / 5) * 100))}%` }}
            />
          </div>
        </div>

        {/* Gold Medal: 7 Weeks */}
        <div
          onClick={() => medals.gold && triggerStreakCelebration('gold')}
          className={`p-3.5 rounded-xl border transition relative cursor-pointer ${
            medals.gold
              ? 'bg-gradient-to-br from-yellow-50 to-amber-100/70 border-amber-400 shadow-md hover:scale-[1.02] ring-1 ring-amber-300'
              : 'bg-slate-50/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Gold Medal">
                🥇
              </span>
              <div>
                <h4 className="text-xs font-black text-[#4A154B]">
                  Gold Medal
                </h4>
                <p className="text-[10px] text-amber-800 font-semibold">
                  7-Week Study Streak
                </p>
              </div>
            </div>
            {medals.gold ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mastery Achieved! 🏆
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {Math.min(currentStreak, 7)}/7 Wks
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                medals.gold ? 'bg-[#D4AF37]' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((currentStreak / 7) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next Milestone Callout */}
      {nextMilestone.remainingWeeks > 0 ? (
        <div className="flex items-center justify-between p-2.5 bg-white/90 rounded-xl border border-amber-200/80 text-xs mt-3">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              Next Goal: Hit this week's study target to get within{' '}
              <strong className="text-[#4A154B]">
                {nextMilestone.remainingWeeks} {nextMilestone.remainingWeeks === 1 ? 'week' : 'weeks'}
              </strong>{' '}
              of the{' '}
              <strong className="capitalize text-amber-700">
                {nextMilestone.medal} Medal
              </strong>
              !
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            {nextMilestone.progressPercent}% to milestone
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs mt-3">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>
              Outstanding! You have attained Gold Medal tier with 7+ consecutive weeks meeting your study goal!
            </span>
          </div>
          <button
            onClick={() => triggerStreakCelebration('gold')}
            className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Celebrate 🎉
          </button>
        </div>
      )}
    </div>
  );
};
