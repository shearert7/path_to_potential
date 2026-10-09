import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { YearLevel, GRADE_PRESET_HOURS } from '../../types';
import { SECONDARY_SUBJECTS, getSubjectsForYear } from '../../constants/data';
import { 
  X, 
  Settings, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  Check, 
  LogIn, 
  LogOut,
  Target
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_YEAR_LEVELS: YearLevel[] = [7, 8, 9, 10, 11, 12];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    user, 
    profile, 
    setGradeLevel, 
    updateProfile, 
    signInWithGoogle, 
    logout 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'subjects' | 'privacy'>('general');
  const [customGoal, setCustomGoal] = useState<number>(profile?.weeklyGoal || 15);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentYear = profile?.yearLevel || 10;
  const enrolled = profile?.enrolledSubjects || SECONDARY_SUBJECTS.slice(0, 6);

  const toggleSubject = async (subject: string) => {
    let updated: string[];
    if (enrolled.includes(subject)) {
      if (enrolled.length <= 1) {
        alert('You must have at least one enrolled subject.');
        return;
      }
      updated = enrolled.filter((s) => s !== subject);
    } else {
      updated = [...enrolled, subject];
    }
    await updateProfile({ enrolledSubjects: updated });
  };

  const handleSaveCustomGoal = async () => {
    if (customGoal > 0 && customGoal <= 60) {
      await updateProfile({ weeklyGoal: customGoal });
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4A154B] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#E5A93C]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Student Settings</h3>
              <p className="text-xs text-purple-200">
                Grade level, weekly target hours, and enrolled subjects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'general'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Grade & Target Hours
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'subjects'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Enrolled Subjects ({enrolled.length})
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'privacy'
                ? 'border-[#4A154B] text-[#4A154B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Data & Staff Access
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Year Level selection with Preset Targets */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Select Grade Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ALL_YEAR_LEVELS.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setGradeLevel(yr);
                        setCustomGoal(GRADE_PRESET_HOURS[yr]);
                      }}
                      className={`p-3 rounded-xl border text-center transition ${
                        currentYear === yr
                          ? 'border-[#4A154B] bg-[#4A154B] text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-sm">Year {yr}</span>
                      <span className={`text-xs block mt-0.5 ${currentYear === yr ? 'text-[#E5A93C] font-semibold' : 'text-slate-500'}`}>
                        {GRADE_PRESET_HOURS[yr]} hrs / week
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Target Hours Customization */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#4A154B]" />
                    <span className="text-xs font-bold text-slate-800">
                      Current Weekly Target Goal:
                    </span>
                  </div>
                  <span className="text-base font-black text-[#4A154B]">
                    {profile?.weeklyGoal || 15} hours / week
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Preset for Year {currentYear} is {GRADE_PRESET_HOURS[currentYear]} hours. You can adjust this if you have a personalized target.
                </p>

                {isEditingGoal ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 text-xs font-bold border rounded-lg border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveCustomGoal}
                      className="px-3 py-1.5 bg-[#4A154B] text-white text-xs font-bold rounded-lg hover:bg-[#380e39]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingGoal(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCustomGoal(profile?.weeklyGoal || 15);
                      setIsEditingGoal(true);
                    }}
                    className="mt-3 text-xs font-semibold text-[#4A154B] hover:underline"
                  >
                    Customise target hours...
                  </button>
                )}
              </div>

              {/* Account Sign-In / Google Status */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#4A154B]">Google Account Status</p>
                  <p className="text-xs text-slate-600">
                    {user ? `Signed in as ${user.email}` : 'Using local guest profile'}
                  </p>
                </div>
                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Select subjects for <strong className="text-[#4A154B]">Year {currentYear}</strong>. These will appear in your timer and timetable dropdowns:
                </p>
                <span className="text-[11px] font-bold text-[#4A154B] bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  Year {currentYear} Subjects
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSubjectsForYear(currentYear).map((subj) => {
                  const isChecked = enrolled.includes(subj);
                  return (
                    <label
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'border-[#4A154B] bg-purple-50/80 font-bold text-[#4A154B]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="text-[#4A154B] focus:ring-[#4A154B] rounded"
                      />
                      <span className="truncate">{subj}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-[#4A154B] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Study Log Storage & Learning Record</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your logged study sessions and weekly timetable schedule are stored securely to assist you in monitoring your learning goals and weekly study consistency.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Storage Agreement Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold rounded-xl transition shadow"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
