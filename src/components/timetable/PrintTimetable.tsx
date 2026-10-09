import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { TIMETABLE_CATEGORY_CONFIG } from '../../constants/data';
import { Printer, ArrowLeft } from 'lucide-react';
import { TimetableCategory } from '../../types';

interface PrintTimetableProps {
  onBack: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const PrintTimetable: React.FC<PrintTimetableProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { timetableBlocksA, timetableBlocksB, activeWeekType } = useStudy();

  const blocks = activeWeekType === 'A' ? timetableBlocksA : timetableBlocksB;

  const plannedStudyMins = blocks
    .filter((b) => b.category === 'Study')
    .reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
  const plannedStudyHours = Math.round((plannedStudyMins / 60) * 10) / 10;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 p-4 sm:p-8 print:p-0">
      {/* Non-print toolbar */}
      <div className="print:hidden max-w-5xl mx-auto mb-6 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Interactive Planner</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold shadow-md transition"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Print or Save to PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="max-w-5xl mx-auto border-2 border-slate-300 print:border-none p-6 sm:p-8 rounded-xl bg-white shadow-sm print:shadow-none print:p-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#4A154B] pb-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#4A154B] tracking-tight uppercase font-serif">
              Study Planner • Weekly Timetable
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              Weekly Study Plan • Week {activeWeekType} Schedule
            </p>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <p className="font-bold text-slate-900">{profile?.name || 'Student'}</p>
            <p className="text-slate-600">Year {profile?.yearLevel || 10} • Target: {profile?.weeklyGoal || 15} hrs/wk</p>
            <p className="text-[#4A154B] font-bold">Planned Study: {plannedStudyHours} hrs</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-bold text-slate-700">Legend:</span>
          {(Object.keys(TIMETABLE_CATEGORY_CONFIG) as TimetableCategory[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${TIMETABLE_CATEGORY_CONFIG[cat].badge}`} />
              <span className="text-slate-700 font-medium">{cat}</span>
            </div>
          ))}
        </div>

        {/* Weekly Day Columns */}
        <div className="grid grid-cols-7 gap-2 border border-slate-300 rounded-lg overflow-hidden">
          {DAYS.map((day) => {
            const dayBlocks = blocks
              .filter((b) => b.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={day} className="flex flex-col border-r last:border-r-0 border-slate-200">
                <div className="bg-[#4A154B] text-white p-2 text-center text-xs font-bold tracking-wide">
                  {day.slice(0, 3)}
                  <span className="hidden sm:inline">{day.slice(3)}</span>
                </div>

                <div className="p-1 space-y-1.5 min-h-[500px] bg-slate-50/50 flex-1">
                  {dayBlocks.length === 0 ? (
                    <div className="text-[10px] text-slate-300 text-center py-4 italic">
                      Free day
                    </div>
                  ) : (
                    dayBlocks.map((blk) => (
                      <div
                        key={blk.id}
                        className={`p-2 rounded text-[11px] border leading-tight ${
                          blk.category === 'Study'
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                            : blk.category === 'School'
                            ? 'bg-purple-50 border-purple-300 text-[#4A154B]'
                            : blk.category === 'Sport / Training'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : blk.category === 'Work'
                            ? 'bg-blue-50 border-blue-300 text-blue-950'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-950'
                        }`}
                      >
                        <div className="font-bold text-[10px] text-slate-500">
                          {blk.startTime} - {blk.endTime}
                        </div>
                        <div className="font-bold line-clamp-2">{blk.title}</div>
                        {blk.subject && (
                          <div className="text-[10px] text-amber-700 truncate">
                            {blk.subject}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Printed from Path to Potential • Academic Study Planner</span>
          <span>"Excellence is not an act, but a habit."</span>
        </div>
      </div>
    </div>
  );
};
