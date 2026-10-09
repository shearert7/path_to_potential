import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, BarChart2, BookOpen, Award } from 'lucide-react';

interface AnalyticsChartsProps {
  selectedTerm: number;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ selectedTerm }) => {
  const { profile } = useAuth();
  const { studyLogs } = useStudy();

  const yearLevel = profile?.yearLevel || 10;
  const targetGoal = profile?.weeklyGoal || 15;

  // Compute weekly trend data for Weeks 1 to 10
  const weeklyTrendData = Array.from({ length: 10 }, (_, i) => i + 1).map((weekNum) => {
    const logsThisWeek = studyLogs.filter(
      (l) => l.termNumber === selectedTerm && l.weekNumber === weekNum
    );
    const totalMinutes = logsThisWeek.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      week: `Wk ${weekNum}`,
      weekNumber: weekNum,
      loggedHours: totalHours,
      targetGoal: targetGoal,
      percent: Math.round((totalHours / targetGoal) * 100),
    };
  });

  // Per-Subject distribution for the term
  const termLogs = studyLogs.filter((l) => l.termNumber === selectedTerm);
  const subjectHoursMap: Record<string, number> = {};
  termLogs.forEach((l) => {
    const mins = l.durationMinutes || 0;
    subjectHoursMap[l.subject] = (subjectHoursMap[l.subject] || 0) + mins;
  });

  const subjectData = Object.keys(subjectHoursMap)
    .map((subj) => ({
      subject: subj.length > 18 ? subj.slice(0, 17) + '...' : subj,
      hours: Math.round((subjectHoursMap[subj] / 60) * 10) / 10,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);

  const totalTermHours = Math.round(
    termLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / 60
  );

  return (
    <div className="space-y-6">
      {/* Weekly Trend vs Target Line Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-[#4A154B] border border-purple-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Weekly Study Hours Trend vs Year {yearLevel} Target ({targetGoal}h/wk)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tracking academic consistency across Term {selectedTerm}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#4A154B]" />
              <span className="font-semibold text-slate-600">Hours Logged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#D4AF37] border-t-2 border-dashed border-[#D4AF37]" />
              <span className="font-semibold text-slate-600">Target Line ({targetGoal}h)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyTrendData} margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="week" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="h" domain={[0, 'dataMax + 6']} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs">
                        <p className="font-bold text-slate-800 mb-1">{label}</p>
                        <p className="text-[#4A154B] font-extrabold text-sm">
                          {data.loggedHours} hours logged
                        </p>
                        <p className="text-slate-500">Year {yearLevel} Goal: {data.targetGoal}h</p>
                        <p className={`font-bold mt-1 ${data.percent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {data.percent}% of weekly target
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={targetGoal}
                stroke="#D4AF37"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                label={{ value: `Goal: ${targetGoal}h`, fill: '#B48A18', fontSize: 11, position: 'right' }}
              />
              <Bar dataKey="loggedHours" fill="#4A154B" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Line
                type="monotone"
                dataKey="loggedHours"
                stroke="#E5A93C"
                strokeWidth={3}
                dot={{ fill: '#4A154B', stroke: '#E5A93C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Subject Distribution Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-[#4A154B] border border-purple-100">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Hours by Subject (Term {selectedTerm})</h3>
              <p className="text-xs text-slate-500 font-medium">
                Academic time investment across subjects • Total: {totalTermHours} hours
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#4A154B] font-bold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{Object.keys(subjectHoursMap).length} Active Subjects</span>
          </div>
        </div>

        {subjectData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 30, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" unit="h" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="subject" type="category" stroke="#64748B" fontSize={11} width={130} />
                <Tooltip formatter={(val: unknown) => [`${val} hours`, 'Study Time']} />
                <Bar dataKey="hours" fill="#D4AF37" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400">
            No subject study sessions recorded for Term {selectedTerm} yet.
          </div>
        )}
      </div>
    </div>
  );
};
