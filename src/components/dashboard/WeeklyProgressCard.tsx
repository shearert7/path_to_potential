import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { Target, Trophy, Sparkles, TrendingUp, Award, Edit3, Check, RotateCcw, BookOpen, Flame } from 'lucide-react';
import { GRADE_PRESET_HOURS } from '../../types';
import confetti from 'canvas-confetti';

export const WeeklyProgressCard: React.FC = () => {
  const { profile, updateProfile, setGradeLevel } = useAuth();
  const { totalHoursThisWeek, studyLogs, currentWeek, currentTerm, streakInfo } = useStudy();

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<number>(profile?.weeklyGoal || 15);

  const yearLevel = profile?.yearLevel || 10;
  const presetGoal = GRADE_PRESET_HOURS[yearLevel] || 15;
  const targetGoal = profile?.weeklyGoal || presetGoal;
  const percentage = Math.round((totalHoursThisWeek / (targetGoal || 1)) * 100);

  const handleSaveGoal = async () => {
    if (goalInput > 0 && goalInput <= 60) {
      await updateProfile({ weeklyGoal: goalInput });
      setIsEditingGoal(false);
    }
  };

  const handleResetToPreset = async () => {
    await setGradeLevel(yearLevel);
    setGoalInput(presetGoal);
    setIsEditingGoal(false);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4A154B', '#D4AF37', '#E5A93C', '#22C55E']
    });
  };

  // Subject breakdown for current week
  const weekLogs = studyLogs.filter(
    (l) => l.weekNumber === currentWeek && l.termNumber === currentTerm
  );

  const subjectMap: Record<string, number> = {};
  weekLogs.forEach((l) => {
    subjectMap[l.subject] = (subjectMap[l.subject] || 0) + (l.durationMinutes || 0);
  });

  const topSubjects = Object.entries(subjectMap)
    .map(([subject, mins]) => ({
      subject,
      hours: Math.round((mins / 60) * 10) / 10,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Term {currentTerm} • Week {currentWeek} Target
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Year {yearLevel} Target Goal ({presetGoal}h Standard)
              </p>
            </div>
          </div>

          {/* Goal pill / Edit button */}
          <div className="flex items-center gap-1.5">
            {isEditingGoal ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Number(e.target.value))}
                  className="w-14 px-2 py-1 text-xs font-bold border rounded border-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveGoal}
                  className="p-1 rounded bg-[#4A154B] text-white hover:bg-[#380e39]"
                  title="Save goal"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetToPreset}
                  className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px]"
                  title={`Reset to Year ${yearLevel} preset (${presetGoal}h)`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setGoalInput(targetGoal);
                  setIsEditingGoal(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#4A154B] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                title="Customise weekly target hours"
              >
                <span>Target: {targetGoal}h</span>
                <Edit3 className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Big Numbers Display */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-[#4A154B] tracking-tight">
              {totalHoursThisWeek}
            </span>
            <span className="text-lg font-bold text-slate-400">/ {targetGoal} hrs</span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1">
            {percentage >= 100 ? (
              <button
                onClick={triggerCelebration}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm animate-bounce"
              >
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>{percentage}% Achieved!</span>
              </button>
            ) : percentage >= 80 ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>{percentage}% On Track</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#4A154B] border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>{percentage}% In Progress</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="space-y-1.5 mb-6">
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentage >= 100
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400'
                  : percentage >= 75
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5A93C]'
                  : 'bg-gradient-to-r from-[#4A154B] to-[#7d247f]'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-400 px-0.5">
            <span>0h Start</span>
            <span>{Math.round(targetGoal * 0.5)}h (50%)</span>
            <span className={percentage >= 100 ? 'text-emerald-600 font-bold' : ''}>
              {targetGoal}h Goal (100%)
            </span>
          </div>
        </div>

        {/* Streak & Achievement Mini Banner */}
        <div className="mb-5 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="font-bold text-slate-800">
              {streakInfo.currentStreak}-Week Study Streak
            </span>
            {streakInfo.medals.gold ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                🥇 Gold Medal
              </span>
            ) : streakInfo.medals.silver ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                🥈 Silver Medal
              </span>
            ) : streakInfo.medals.bronze ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                🥉 Bronze Medal
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500">
                ({streakInfo.nextMilestone.remainingWeeks} wks to Bronze)
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-[#4A154B] hidden sm:inline">
            Best: {streakInfo.longestStreak} Wks
          </span>
        </div>

        {/* Weekly Subject Hours Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#4A154B]" />
            Logged This Week by Subject
          </h4>
          {topSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topSubjects.map((item) => (
                <div
                  key={item.subject}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-semibold text-slate-700 truncate mr-2">
                    {item.subject}
                  </span>
                  <span className="font-bold text-[#4A154B] flex-shrink-0">
                    {item.hours}h
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              Start study timer to see your weekly subject breakdown.
            </p>
          )}
        </div>
      </div>

      {/* Motivational message footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#D4AF37]" />
          <span>
            {percentage >= 100
              ? 'Goal achieved! Outstanding dedication this week.'
              : `${Math.max(0, Math.round((targetGoal - totalHoursThisWeek) * 10) / 10)} hours remaining to reach Year ${yearLevel} target.`}
          </span>
        </div>
        {percentage >= 100 && (
          <span className="font-bold text-emerald-600">Complete! ⭐</span>
        )}
      </div>
    </div>
  );
};
