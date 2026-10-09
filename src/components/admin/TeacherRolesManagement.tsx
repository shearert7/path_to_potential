import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { YearLevel, TeacherRecord } from '../../types';
import { 
  UserPlus, 
  Shield, 
  Trash2, 
  Check, 
  Mail, 
  UserCheck, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export const TeacherRolesManagement: React.FC = () => {
  const { teachers, addTeacher, deleteTeacher } = useStudy();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [selectedYears, setSelectedYears] = useState<YearLevel[]>([7]);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const toggleYearSelection = (year: YearLevel) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length === 1) {
        alert('A teacher must have access to at least one year level.');
        return;
      }
      setSelectedYears(selectedYears.filter((y) => y !== year));
    } else {
      setSelectedYears([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please provide teacher name and email address.');
      return;
    }
    if (selectedYears.length === 0) {
      alert('Please select at least one year level for this teacher.');
      return;
    }

    await addTeacher({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: title.trim() || 'Academic Care Leader',
      assignedYearLevels: selectedYears,
    });

    setName('');
    setEmail('');
    setTitle('');
    setSelectedYears([7]);
    setFeedbackMsg(`Successfully authorized teacher access for ${email.trim()}.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Notice */}
      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#4A154B] text-[#D4AF37]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#4A154B]">
              Role-Based Faculty Access Delegation
            </h3>
            <p className="text-slate-600 text-[11px] mt-0.5">
              As Administrator (shearert@glennie.qld.edu.au), you can grant specific Year Level oversight to teaching staff.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[11px] whitespace-nowrap">
          {teachers.length} Active Teacher Accounts
        </span>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid: Add Teacher Form + Registered Teachers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Add New Teacher Role */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-md border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-[#4A154B]" />
            <h4 className="font-bold text-sm text-slate-800">
              Authorize New Teacher Role
            </h4>
          </div>

          <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Teacher Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mrs. Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Glennie Staff Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jenkinss@glennie.qld.edu.au"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Faculty Role / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Year 7 Coordinator or Maths Mentor"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
              />
            </div>

            {/* Checkboxes for Year Levels Access */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Authorized Year Levels
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                This teacher will only be able to view students and logs in selected grades:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([7, 8, 9, 10, 11, 12] as YearLevel[]).map((yr) => {
                  const isChecked = selectedYears.includes(yr);
                  return (
                    <button
                      type="button"
                      key={yr}
                      onClick={() => toggleYearSelection(yr)}
                      className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-[#4A154B] text-white border-[#4A154B] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Year {yr}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-[#D4AF37] font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Authorize Teacher Access</span>
            </button>
          </form>
        </div>

        {/* Existing Authorized Teachers Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#4A154B]" />
              <h4 className="font-bold text-sm text-slate-800">
                Authorized Faculty Staff
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              {teachers.length} teachers configured
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {teacher.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-[#4A154B] font-semibold border border-purple-200">
                      {teacher.title || 'Teacher'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{teacher.email}</span>
                  </div>

                  {/* Year level badges */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">
                      Assigned:
                    </span>
                    {teacher.assignedYearLevels.map((yr) => (
                      <span
                        key={yr}
                        className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[10px]"
                      >
                        Year {yr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`Remove authorization for ${teacher.name}?`)) {
                        deleteTeacher(teacher.id);
                      }
                    }}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                    title="Revoke teacher access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
