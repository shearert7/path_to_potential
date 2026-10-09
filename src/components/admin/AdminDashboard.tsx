import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { StudentCohortRecord, YearLevel } from '../../types';
import { StudentDetailDrawer } from './StudentDetailDrawer';
import { TeacherRolesManagement } from './TeacherRolesManagement';
import { 
  Users, 
  Search, 
  Download, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  ShieldCheck,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { profile, isAdmin, isTeacher } = useAuth();
  const { cohortRecords } = useStudy();

  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'teachers'>('analytics');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentCohortRecord | null>(null);

  // If user is a teacher with specific assigned year levels, restrict scope
  const teacherAssignedYears: YearLevel[] = useMemo(() => {
    if (isTeacher && profile?.assignedYearLevels && profile.assignedYearLevels.length > 0) {
      return profile.assignedYearLevels;
    }
    return [7, 8, 9, 10, 11, 12];
  }, [isTeacher, profile?.assignedYearLevels]);

  const [selectedYear, setSelectedYear] = useState<string>(
    isTeacher && teacherAssignedYears.length === 1 ? teacherAssignedYears[0].toString() : 'All'
  );
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'On Track' | 'Near Target' | 'Needs Support'>('All');

  // Accessible students (teachers only see their assigned grades; admin sees all)
  const accessibleCohort = useMemo(() => {
    if (isAdmin) {
      return cohortRecords;
    }
    // Teacher access restricted to assignedYearLevels
    return cohortRecords.filter((s) => teacherAssignedYears.includes(s.user.yearLevel));
  }, [cohortRecords, isAdmin, teacherAssignedYears]);

  // Filtered roster by search, year, and status
  const filteredStudents = useMemo(() => {
    return accessibleCohort.filter((student) => {
      const matchesSearch =
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesYear =
        selectedYear === 'All' || student.user.yearLevel.toString() === selectedYear;

      const matchesStatus =
        selectedStatus === 'All' || student.status === selectedStatus;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [accessibleCohort, searchQuery, selectedYear, selectedStatus]);

  // Aggregate Cohort Metrics (for accessible scope)
  const totalCohortHours = useMemo(() => {
    return Math.round(accessibleCohort.reduce((acc, s) => acc + s.totalHoursThisWeek, 0) * 10) / 10;
  }, [accessibleCohort]);

  const averageHoursPerStudent = useMemo(() => {
    if (accessibleCohort.length === 0) return 0;
    return Math.round((totalCohortHours / accessibleCohort.length) * 10) / 10;
  }, [accessibleCohort, totalCohortHours]);

  const onTrackCount = accessibleCohort.filter((s) => s.status === 'On Track').length;
  const percentMeetingTarget = useMemo(() => {
    if (accessibleCohort.length === 0) return 0;
    return Math.round((onTrackCount / accessibleCohort.length) * 100);
  }, [accessibleCohort, onTrackCount]);

  const needsSupportCount = accessibleCohort.filter((s) => s.status === 'Needs Support').length;

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Email', 'Year Level', 'Weekly Goal (hrs)', 'Hours Logged This Week', 'Percent Achieved (%)', 'Status', 'Recent Subject'];
    const rows = filteredStudents.map((s) => [
      `"${s.user.name}"`,
      `"${s.user.email}"`,
      s.user.yearLevel,
      s.goalHours,
      s.totalHoursThisWeek,
      s.percentAchieved,
      `"${s.status}"`,
      `"${s.recentSubject}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const roleLabel = isTeacher ? `Teacher_Yr_${teacherAssignedYears.join('_')}` : 'Admin_All';
    link.setAttribute('download', `Path_To_Potential_Cohort_${roleLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#4A154B] text-[#D4AF37] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {isAdmin ? 'Academic Administration & Cohort Analytics' : `Teacher Academic Portal (Year ${teacherAssignedYears.join(', ')})`}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-[#4A154B] font-extrabold">
                {isAdmin ? 'Administrator' : 'Faculty Teacher'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isAdmin
                ? 'Comprehensive monitoring of Year 7–12 independent study logs and staff authorization'
                : `Student study logs and progress tracking for authorized grade level(s): Year ${teacherAssignedYears.join(', ')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* If administrator, tab buttons to switch between Cohort Analytics and Teacher Roles */}
          {isAdmin && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mr-2 text-xs font-bold">
              <button
                onClick={() => setActiveAdminTab('analytics')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeAdminTab === 'analytics'
                    ? 'bg-[#4A154B] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cohort Analytics
              </button>
              <button
                onClick={() => setActiveAdminTab('teachers')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  activeAdminTab === 'teachers'
                    ? 'bg-[#4A154B] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Teacher Roles</span>
              </button>
            </div>
          )}

          {activeAdminTab === 'analytics' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-[#4A154B]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab: Teacher Roles Management (Admin only) */}
      {isAdmin && activeAdminTab === 'teachers' ? (
        <TeacherRolesManagement />
      ) : (
        /* Analytics Tab */
        <>
          {/* Cohort Summary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Monitored Hours
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-[#4A154B]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#4A154B]">{totalCohortHours}h</p>
              <p className="text-xs text-slate-400 mt-1">Logged this week in assigned grades</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Average Hours / Student
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{averageHoursPerStudent}h</p>
              <p className="text-xs text-slate-400 mt-1">Across monitored students</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Meeting Target Goal
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600">{percentMeetingTarget}%</p>
              <p className="text-xs text-slate-400 mt-1">
                {onTrackCount} of {accessibleCohort.length} students on track
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Needs Support Alert
                </span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-rose-600">{needsSupportCount}</p>
              <p className="text-xs text-slate-400 mt-1">Students below 60% of grade benchmark</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Year Level filter: filtered according to teacher permissions or all */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                <span className="text-slate-400 px-2 text-[11px]">Year:</span>
                {isAdmin && (
                  <button
                    onClick={() => setSelectedYear('All')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      selectedYear === 'All'
                        ? 'bg-[#4A154B] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                )}
                {(isAdmin ? [7, 8, 9, 10, 11, 12] : teacherAssignedYears).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr.toString())}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      selectedYear === yr.toString()
                        ? 'bg-[#4A154B] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yr {yr}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <span className="text-slate-400 px-2 text-[11px]">Status:</span>
                {(['All', 'On Track', 'Near Target', 'Needs Support'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      selectedStatus === st
                        ? 'bg-[#4A154B] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4A154B]" />
                <span className="font-bold text-sm text-slate-800">
                  Student Cohort Roster ({filteredStudents.length})
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Click any student to view detailed timetable & logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3">Year Level</th>
                    <th className="py-3 px-3">Target Goal</th>
                    <th className="py-3 px-3">Hours Logged</th>
                    <th className="py-3 px-3">% Achieved</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No students match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((record) => (
                      <tr
                        key={record.user.uid}
                        onClick={() => setSelectedStudent(record)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {record.user.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {record.user.email}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-700">
                          Year {record.user.yearLevel}
                        </td>

                        <td className="py-3 px-3 text-slate-500 font-semibold">
                          {record.goalHours}h / wk
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-black text-[#4A154B] text-sm">
                            {record.totalHoursThisWeek}h
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`font-bold ${
                              record.percentAchieved >= 100
                                ? 'text-emerald-600'
                                : record.percentAchieved >= 80
                                ? 'text-amber-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {record.percentAchieved}%
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              record.status === 'On Track'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : record.status === 'Near Target'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(record);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-[#4A154B] hover:bg-purple-100 font-bold text-xs transition border border-purple-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Detailed Drawer */}
      {selectedStudent && (
        <StudentDetailDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
