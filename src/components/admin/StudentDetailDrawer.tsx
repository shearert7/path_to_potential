import React from 'react';
import { StudentCohortRecord } from '../../types';
import { TIMETABLE_CATEGORY_CONFIG } from '../../constants/data';
import { 
  X, 
  Calendar, 
  BookOpen, 
  BarChart3
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface StudentDetailDrawerProps {
  student: StudentCohortRecord | null;
  onClose: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({ student, onClose }) => {
  if (!student) return null;

  const { user, totalHoursThisWeek, goalHours, percentAchieved, status, logs, timetableBlocks } = student;

  const subjectMap: Record<string, number> = {};
  logs.forEach((l) => {
    subjectMap[l.subject] = (subjectMap[l.subject] || 0) + (l.durationMinutes || 0);
  });

  const subjectChartData = Object.keys(subjectMap).length > 0
    ? Object.keys(subjectMap).map((s) => ({
        subject: s.length > 14 ? s.slice(0, 13) + '..' : s,
        hours: Math.round((subjectMap[s] / 60) * 10) / 10,
      }))
    : user.enrolledSubjects.map((s) => ({
        subject: s.length > 14 ? s.slice(0, 13) + '..' : s,
        hours: Math.round((totalHoursThisWeek / (user.enrolledSubjects.length || 5)) * 10) / 10,
      }));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="bg-[#4A154B] px-6 py-5 text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] text-purple-950 font-black text-sm flex items-center justify-center shadow">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {user.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-[#E5A93C] font-semibold">
                    Year {user.yearLevel}
                  </span>
                </h3>
                <p className="text-xs text-purple-200">{user.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-center">
                <p className="text-xs text-slate-500 font-semibold">Current Week</p>
                <p className="text-xl font-black text-[#4A154B]">{totalHoursThisWeek}h</p>
                <p className="text-[11px] text-slate-400">Target: {goalHours}h</p>
              </div>
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-500 font-semibold">% Target Met</p>
                <p className="text-xl font-black text-amber-700">{percentAchieved}%</p>
                <p className="text-[11px] text-amber-600 font-semibold">Academic Pace</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-semibold">Cohort Status</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      status === 'On Track'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'Near Target'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#4A154B]" />
                Enrolled Subjects
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.enrolledSubjects.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Subject Distribution Chart */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Study Time by Subject
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                    <XAxis dataKey="subject" fontSize={10} stroke="#64748B" angle={-15} textAnchor="end" />
                    <YAxis unit="h" fontSize={10} stroke="#64748B" />
                    <Tooltip formatter={(v: unknown) => [`${v} hours`, 'Study Time']} />
                    <Bar dataKey="hours" fill="#4A154B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student's Timetable Schedule */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#4A154B]" />
                Timetable Schedule
              </h4>
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const dayBlocks = (timetableBlocks || [])
                    .filter((b) => b.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  if (dayBlocks.length === 0) return null;

                  return (
                    <div key={day} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-extrabold text-[#4A154B] mb-2">{day}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dayBlocks.map((b) => {
                          const config = TIMETABLE_CATEGORY_CONFIG[b.category] || TIMETABLE_CATEGORY_CONFIG['Study'];
                          return (
                            <div
                              key={b.id}
                              className={`p-2 rounded-lg text-xs border ${config.bg} ${config.border}`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                                <span>{b.startTime} - {b.endTime}</span>
                                <span className={`px-1 rounded text-[9px] ${config.badge}`}>{b.category}</span>
                              </div>
                              <p className="font-bold text-slate-900 truncate">{b.title}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Academic Performance Tracker</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#4A154B] hover:bg-[#380e39] text-white font-bold rounded-xl transition"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
