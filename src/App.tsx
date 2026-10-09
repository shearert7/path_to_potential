import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import { Navbar } from './components/Navbar';
import { StudyTimer } from './components/dashboard/StudyTimer';
import { WeeklyProgressCard } from './components/dashboard/WeeklyProgressCard';
import { RecentLogsList } from './components/dashboard/RecentLogsList';
import { TimetableGrid } from './components/timetable/TimetableGrid';
import { PrintTimetable } from './components/timetable/PrintTimetable';
import { HistorySheet } from './components/history/HistorySheet';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminSignInPage } from './components/admin/AdminSignInPage';
import { ManualLogModal } from './components/dashboard/ManualLogModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AcademicRationaleModal } from './components/common/AcademicRationaleModal';
import { ConsentBanner } from './components/common/ConsentBanner';
import { ArrowLeft, LogOut, BookOpen } from 'lucide-react';

const AppContent: React.FC = () => {
  const { profile, updateProfile, isAdmin, isTeacher, canAccessFacultyPortal } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'history' | 'admin'>('dashboard');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRationaleOpen, setIsRationaleOpen] = useState<boolean>(false);
  const [showAdminSignIn, setShowAdminSignIn] = useState<boolean>(false);

  // Check URL query param ?admin=true on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdminSignIn(true);
    }
  }, []);

  // Separate Admin Sign-In Page
  if (showAdminSignIn) {
    return (
      <AdminSignInPage
        onBackToPlanner={() => setShowAdminSignIn(false)}
        onAdminAuthenticated={() => {
          setShowAdminSignIn(false);
          setActiveTab('admin');
        }}
      />
    );
  }

  // Print Mode
  if (isPrintMode) {
    return <PrintTimetable onBack={() => setIsPrintMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Student Study Log Storage Notice */}
      <ConsentBanner />

      {/* Admin Mode Top Indicator (only when viewing admin dashboard) */}
      {isAdmin && activeTab === 'admin' && (
        <div className="bg-[#350B36] text-[#E5A93C] text-xs px-4 py-2 flex items-center justify-between border-b border-[#D4AF37]/40 shadow-inner">
          <span className="font-bold">
            Administrator Access Mode • Cohort Analytics
          </span>
          <button
            onClick={() => {
              updateProfile({ role: 'student' });
              setActiveTab('dashboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Planner</span>
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Student Dashboard & Timer */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <StudyTimer onOpenManualModal={() => setIsManualModalOpen(true)} />
              </div>
              <div className="lg:col-span-5">
                <WeeklyProgressCard />
              </div>
            </div>

            <RecentLogsList />
          </div>
        )}

        {/* TAB 2: Weekly Timetable Planner */}
        {activeTab === 'timetable' && (
          <TimetableGrid onOpenPrint={() => setIsPrintMode(true)} />
        )}

        {/* TAB 3: Log History & Goal Tracking */}
        {activeTab === 'history' && (
          <HistorySheet />
        )}

        {/* TAB 4: Faculty / Admin Analytics */}
        {activeTab === 'admin' && (
          canAccessFacultyPortal ? (
            <AdminDashboard />
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm font-bold text-slate-800">
                Administrator access is restricted to shearert@glennie.qld.edu.au or authorized faculty teachers.
              </p>
              <button
                onClick={() => setShowAdminSignIn(true)}
                className="mt-4 px-4 py-2 bg-[#4A154B] text-[#D4AF37] text-xs font-bold rounded-xl shadow-sm hover:bg-[#380e39] transition"
              >
                Sign In with Authorized Account
              </button>
            </div>
          )
        )}
      </main>

      {/* Manual Study Entry Modal */}
      <ManualLogModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* Student Settings Modal (Cog Icon) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Educational Background & Rationale Modal */}
      <AcademicRationaleModal
        isOpen={isRationaleOpen}
        onClose={() => setIsRationaleOpen(false)}
      />

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-extrabold text-slate-800 text-sm font-serif">
              Path to Potential
            </p>
            <p className="text-[11px] text-[#4A154B] font-semibold">
              Study Planning Tool
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <span className="text-slate-600 font-semibold">
              Year {profile?.yearLevel || 10} • Target: {profile?.weeklyGoal || 15}h / week
            </span>

            {/* Background & Rationale link */}
            <button
              onClick={() => setIsRationaleOpen(true)}
              className="flex items-center gap-1.5 text-xs text-[#4A154B] hover:text-[#380e39] font-bold transition hover:underline"
              title="Learn about the cognitive science and educational research behind Path to Potential"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Background & Educational Rationale</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StudyProvider>
        <AppContent />
      </StudyProvider>
    </AuthProvider>
  );
}
