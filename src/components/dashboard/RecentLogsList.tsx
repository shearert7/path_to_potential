import React from 'react';
import { useStudy } from '../../context/StudyContext';
import { Clock, Trash2, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export const RecentLogsList: React.FC = () => {
  const { studyLogs, deleteStudyLog } = useStudy();

  const recentLogs = studyLogs.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-[#4A154B] border border-purple-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Logged Sessions</h3>
            <p className="text-xs text-slate-500 font-medium">
              Latest tracked study activity
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500">
          Total Sessions: {studyLogs.length}
        </span>
      </div>

      {recentLogs.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-slate-300" />
          <p>No study sessions recorded yet today.</p>
          <p className="text-xs text-slate-400">Start the timer above or use Manual Entry.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => {
            const hours = Math.floor(log.durationMinutes / 60);
            const mins = log.durationMinutes % 60;
            const timeDisplay = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins} mins`;

            return (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/80 px-2 -mx-2 rounded-xl transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="min-w-[88px] px-3 h-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold border border-amber-500/20 whitespace-nowrap text-center">
                    <span className="text-xs font-bold leading-none">{timeDisplay}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {log.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {log.date}
                      </span>
                      <span>•</span>
                      <span>Term {log.termNumber} Wk {log.weekNumber}</span>
                      {log.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 truncate max-w-[200px] sm:max-w-xs italic">
                            "{log.notes}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remove this ${log.subject} study session?`)) {
                      deleteStudyLog(log.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete log entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
