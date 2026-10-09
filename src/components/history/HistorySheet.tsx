import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { AnalyticsCharts } from './AnalyticsCharts';
import { StreakMedalsCard } from '../common/StreakMedalsCard';
import { exportStudyLogsToCSV, exportStudyLogsToPDF } from '../../lib/exportUtils';
import { 
  FileSpreadsheet, 
  Check, 
  Edit2, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Calendar, 
  Sparkles,
  Sliders,
  AlertCircle
} from 'lucide-react';

export const HistorySheet: React.FC = () => {
  const { profile } = useAuth();
  const { 
    studyLogs, 
    streakInfo, 
    getWeeksForTerm, 
    addWeekToTerm, 
    deleteWeekFromTerm, 
    resetTermWeeks 
  } = useStudy();

  const [selectedTerm, setSelectedTerm] = useState<number>(3);
  const [editingWeekIndex, setEditingWeekIndex] = useState<number | null>(null);
  const [weekReflectionInput, setWeekReflectionInput] = useState<string>('');
  const [isManagingWeeks, setIsManagingWeeks] = useState<boolean>(false);
  const [reflectionsMap, setReflectionsMap] = useState<Record<string, string>>({
    't3-w1': 'Solid start to Term 3. Established morning routine and regular homework schedule.',
    't3-w2': 'Focused heavily on science practical writeup and mathematics chapter exercises.',
    't3-w3': 'Hit weekly goal target. Completed revision paper under timed conditions.',
    't3-w4': 'Drafted English analytical essay thesis and revised history notes.',
    't3-w5': 'Balanced school sports carnival with dedicated evening study sessions.',
    't3-w6': 'Current active week. Deep work on mathematics problem solving.',
  });

  const yearLevel = profile?.yearLevel || 10;
  const targetGoal = profile?.weeklyGoal || 15;

  const handleSaveReflection = (key: string) => {
    setReflectionsMap((prev) => ({
      ...prev,
      [key]: weekReflectionInput.trim(),
    }));
    setEditingWeekIndex(null);
  };

  const termWeeksList = getWeeksForTerm(selectedTerm);

  const termWeeks = termWeeksList.map((weekNum) => {
    const key = `t${selectedTerm}-w${weekNum}`;
    const logsThisWeek = studyLogs.filter(
      (l) => l.termNumber === selectedTerm && l.weekNumber === weekNum
    );

    const totalMinutes = logsThisWeek.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const percent = Math.round((totalHours / (targetGoal || 1)) * 100);

    const subjectMap: Record<string, number> = {};
    logsThisWeek.forEach((l) => {
      subjectMap[l.subject] = (subjectMap[l.subject] || 0) + (l.durationMinutes || 0);
    });

    const topSubject = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    let statusBadge = { label: 'Incomplete', class: 'bg-slate-100 text-slate-500' };
    if (totalHours >= targetGoal) {
      statusBadge = { label: 'Target Met (100%+)', class: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
    } else if (totalHours >= targetGoal * 0.8) {
      statusBadge = { label: 'Near Target (80-99%)', class: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
    } else if (totalHours > 0) {
      statusBadge = { label: 'Needs Support (<80%)', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    }

    return {
      weekNum,
      key,
      totalHours,
      percent,
      sessionsCount: logsThisWeek.length,
      topSubject,
      subjectMap,
      statusBadge,
      reflection: reflectionsMap[key] || '',
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-[#4A154B] border border-purple-100">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Weekly Study Log Sheet & History
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Academic Term Record • Year {yearLevel} Target Benchmark ({targetGoal}h/wk)
            </p>
          </div>
        </div>

        {/* Right side: Exports & Term switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            onClick={() => exportStudyLogsToCSV(studyLogs, profile, selectedTerm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs transition shadow-sm"
            title="Download study records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#4A154B]" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF Academic Report button */}
          <button
            onClick={() => exportStudyLogsToPDF(studyLogs, profile, selectedTerm, streakInfo, reflectionsMap, termWeeksList)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4A154B] hover:bg-[#380e39] text-[#D4AF37] rounded-xl font-bold text-xs transition shadow-sm"
            title="Print or save official academic record PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Academic PDF</span>
          </button>

          {/* Term Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl ml-1">
            {[1, 2, 3, 4].map((term) => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  selectedTerm === term
                    ? 'bg-[#4A154B] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Term {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gamification: Streaks & Medals Showcase */}
      <StreakMedalsCard streakInfo={streakInfo} variant="full" />

      {/* Term Week Customization Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4A154B]" />
          <span className="font-bold text-slate-700">
            Term {selectedTerm} Structure:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#4A154B] font-extrabold border border-purple-200">
            {termWeeksList.length} Weeks Configured
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Quick Lengths:
          </span>
          <button
            onClick={() => resetTermWeeks(selectedTerm, 8)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
              termWeeksList.length === 8
                ? 'bg-[#4A154B] text-white border-[#4A154B]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            8 Weeks
          </button>
          <button
            onClick={() => resetTermWeeks(selectedTerm, 9)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
              termWeeksList.length === 9
                ? 'bg-[#4A154B] text-white border-[#4A154B]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            9 Weeks (Term 4)
          </button>
          <button
            onClick={() => resetTermWeeks(selectedTerm, 10)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
              termWeeksList.length === 10
                ? 'bg-[#4A154B] text-white border-[#4A154B]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            10 Weeks (Standard)
          </button>

          {/* Add custom week or holiday week */}
          <button
            onClick={() => addWeekToTerm(selectedTerm)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition"
            title="Add another week or holiday study week"
          >
            <Plus className="w-3 h-3 text-emerald-700" />
            <span>+ Add Week</span>
          </button>

          {/* Toggle week delete buttons */}
          <button
            onClick={() => setIsManagingWeeks(!isManagingWeeks)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              isManagingWeeks
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>{isManagingWeeks ? 'Done' : 'Manage Weeks'}</span>
          </button>
        </div>
      </div>

      {isManagingWeeks && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              Click the red trash icon next to any week below to remove it from Term {selectedTerm}.
            </span>
          </div>
        </div>
      )}

      {/* Visual Analytics Recharts Charts */}
      <AnalyticsCharts selectedTerm={selectedTerm} />

      {/* Historical Weekly Study Log Sheet Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800">
              Term {selectedTerm} Weekly Log Sheet Breakdown
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {termWeeksList.length} Weeks
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click notes to edit weekly reflections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Term & Week</th>
                <th className="py-3.5 px-3">Logged Hours</th>
                <th className="py-3.5 px-3">Goal</th>
                <th className="py-3.5 px-3">% Achieved</th>
                <th className="py-3.5 px-3">Top Subject</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 min-w-[220px]">Student Reflections & Notes</th>
                {isManagingWeeks && (
                  <th className="py-3.5 px-3 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {termWeeks.map((row) => (
                <tr key={row.key} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    Term {selectedTerm} Wk {row.weekNum}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-extrabold text-[#4A154B] text-sm">
                      {row.totalHours}h
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {row.sessionsCount} sessions
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-500 font-semibold">
                    {targetGoal}h
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        row.percent >= 100
                          ? 'text-emerald-600'
                          : row.percent >= 80
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.percent}%
                    </span>
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-700 truncate max-w-[130px]">
                    {row.topSubject}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] border ${row.statusBadge.class}`}
                    >
                      {row.statusBadge.label}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {editingWeekIndex === row.weekNum ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={weekReflectionInput}
                          onChange={(e) => setWeekReflectionInput(e.target.value)}
                          placeholder="Enter your reflection for this week..."
                          className="w-full px-2 py-1 border rounded text-xs border-amber-400 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveReflection(row.key)}
                          className="p-1 rounded bg-[#4A154B] text-white hover:bg-[#380e39]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingWeekIndex(row.weekNum);
                          setWeekReflectionInput(row.reflection);
                        }}
                        className="group flex items-center justify-between cursor-pointer py-1 text-slate-600 hover:text-slate-900"
                      >
                        <span className="truncate italic">
                          {row.reflection || (
                            <span className="text-slate-300 not-italic">
                              + Click to add study reflection note...
                            </span>
                          )}
                        </span>
                        <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-[#4A154B] opacity-0 group-hover:opacity-100 transition ml-2 flex-shrink-0" />
                      </div>
                    )}
                  </td>

                  {isManagingWeeks && (
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => deleteWeekFromTerm(selectedTerm, row.weekNum)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        title={`Delete Week ${row.weekNum}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
