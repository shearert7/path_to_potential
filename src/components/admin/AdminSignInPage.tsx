import React, { useState } from 'react';
import { useAuth, ADMIN_EMAIL } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { YearLevel } from '../../types';
import { 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  GraduationCap,
  UserCheck
} from 'lucide-react';

interface AdminSignInPageProps {
  onBackToPlanner: () => void;
  onAdminAuthenticated: () => void;
}

export const AdminSignInPage: React.FC<AdminSignInPageProps> = ({
  onBackToPlanner,
  onAdminAuthenticated,
}) => {
  const { user, profile, updateProfile, signInWithGoogle, loginAsDemoTeacher, isAdmin, isTeacher } = useAuth();
  const { teachers } = useStudy();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If already signed in as shearert@glennie.qld.edu.au, can proceed directly
  const activeEmail = (user?.email || profile?.email || '').toLowerCase().trim();
  const isCurrentlyShearer = activeEmail === ADMIN_EMAIL.toLowerCase();
  const registeredTeacher = teachers.find((t) => t.email.toLowerCase() === activeEmail);

  const handleGoogleAdminSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // On return from popup, check user
      setTimeout(async () => {
        const currentEmail = (user?.email || profile?.email || '').toLowerCase().trim();
        if (currentEmail === ADMIN_EMAIL.toLowerCase()) {
          await updateProfile({ role: 'admin' });
          onAdminAuthenticated();
        } else {
          // Check if registered as a teacher with year level oversight
          const matchingTeacher = teachers.find((t) => t.email.toLowerCase() === currentEmail);
          if (matchingTeacher) {
            await updateProfile({ 
              role: 'teacher', 
              name: matchingTeacher.name,
              assignedYearLevels: matchingTeacher.assignedYearLevels 
            });
            onAdminAuthenticated();
          } else if (currentEmail) {
            setErrorMsg(`Access Denied: Signed in as ${currentEmail}. To access the portal, you must be the Administrator (${ADMIN_EMAIL}) or an authorized faculty teacher.`);
          }
        }
      }, 600);
    } catch (err) {
      setErrorMsg('Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAdminAccess = async () => {
    loginAsDemoTeacher(); // Dr. Tim Shearer full admin
    await updateProfile({ role: 'admin' });
    onAdminAuthenticated();
  };

  const handleDemoTeacherAccess = async (years: YearLevel[], name: string, email: string) => {
    loginAsDemoTeacher(years, name, email);
    await updateProfile({ 
      role: 'teacher', 
      name, 
      assignedYearLevels: years 
    });
    onAdminAuthenticated();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Return to Planner button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 px-4">
        <button
          onClick={onBackToPlanner}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#4A154B] bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Study Planner</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#4A154B] text-[#D4AF37] flex items-center justify-center mx-auto shadow-md border-2 border-[#D4AF37]/50 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif uppercase tracking-tight">
            Faculty & Admin Access
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Restricted to authorized administrator & teacher accounts
          </p>
        </div>

        <div className="mt-6 bg-white py-8 px-6 shadow-xl border border-slate-200 sm:rounded-2xl sm:px-10 space-y-6">
          <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
            <p className="font-bold text-[#4A154B] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              Staff Verification Required
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Full administrator analytics requires sign-in with:
            </p>
            <div className="p-2 bg-white rounded-lg border border-purple-200 font-mono text-center font-bold text-[#4A154B] select-all text-xs">
              {ADMIN_EMAIL}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Authorized teachers can also sign in to view their assigned year levels (e.g. Year 7).
            </p>
          </div>

          {isCurrentlyShearer ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold text-center">
                Authenticated as Administrator ({ADMIN_EMAIL})
              </div>
              <button
                onClick={async () => {
                  await updateProfile({ role: 'admin' });
                  onAdminAuthenticated();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold shadow-md transition"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Enter Administrator Portal</span>
              </button>
            </div>
          ) : registeredTeacher ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold text-center">
                Authenticated as Teacher: {registeredTeacher.name} (Year {registeredTeacher.assignedYearLevels.join(', ')})
              </div>
              <button
                onClick={async () => {
                  await updateProfile({ 
                    role: 'teacher',
                    assignedYearLevels: registeredTeacher.assignedYearLevels 
                  });
                  onAdminAuthenticated();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-[#D4AF37] text-xs font-bold shadow-md transition"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Enter Teacher Portal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleGoogleAdminSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.15C3.25 21.4 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.58H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.42l4.11-3.15z"/>
                  <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.6 1.21 6.58l4.11 3.15c.94-2.83 3.58-4.96 6.68-4.96z"/>
                </svg>
                <span>Sign in with Glennie Google Account</span>
              </button>

              {/* Demo shortcuts for testing */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold text-center">
                  Preview & Testing Roles
                </p>
                <button
                  type="button"
                  onClick={handleDemoAdminAccess}
                  className="w-full flex items-center justify-between py-2 px-3 text-xs font-bold text-[#4A154B] bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Administrator (Dr. Tim Shearer)</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">All Years</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoTeacherAccess([7], 'Mrs. Rebecca Clarke', 'clarker@glennie.qld.edu.au')}
                  className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                >
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Teacher Role (Mrs. Clarke)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">Year 7 Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoTeacherAccess([11, 12], 'Mr. Andrew Henderson', 'hendersona@glennie.qld.edu.au')}
                  className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                >
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Senior Mentor (Mr. Henderson)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">Years 11 & 12</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
