import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  CalendarDays, 
  BarChart3, 
  LogIn, 
  LogOut, 
  Settings,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'timetable' | 'history' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'timetable' | 'history' | 'admin') => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings 
}) => {
  const { user, profile, signInWithGoogle, logout, isAdmin, isTeacher, canAccessFacultyPortal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#4A154B] text-white shadow-md border-b-2 border-[#D4AF37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Heading: Path to Potential, Subheading: Study Planning Tool (No logo) */}
          <div 
            className="flex items-center cursor-pointer select-none" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-serif uppercase leading-tight">
                Path to Potential
              </span>
              <span className="text-[11px] font-semibold text-[#E5A93C] tracking-wide uppercase">
                Study Planning Tool
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white/15 text-[#E5A93C] shadow-inner border-b-2 border-[#D4AF37]'
                  : 'text-purple-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Dashboard & Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'timetable'
                  ? 'bg-white/15 text-[#E5A93C] shadow-inner border-b-2 border-[#D4AF37]'
                  : 'text-purple-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Weekly Timetable</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white/15 text-[#E5A93C] shadow-inner border-b-2 border-[#D4AF37]'
                  : 'text-purple-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Log History & Goals</span>
            </button>

            {canAccessFacultyPortal && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white/15 text-[#E5A93C] shadow-inner border-b-2 border-[#D4AF37]'
                    : 'text-purple-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>{isAdmin ? 'Admin Analytics' : 'Teacher Portal'}</span>
              </button>
            )}
          </nav>

          {/* Right Action: Cog Settings Icon + Google Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings Cog Icon Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white transition"
              title="Student Settings (Grade, Target Hours, Subjects)"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Google Authentication */}
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
                title={`Signed in as ${user.email}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5A93C] hover:from-[#c59a27] hover:to-[#d4992c] text-purple-950 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-white/10 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-white/20 text-[#E5A93C]' : 'text-purple-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'timetable' ? 'bg-white/20 text-[#E5A93C]' : 'text-purple-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Timetable</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              activeTab === 'history' ? 'bg-white/20 text-[#E5A93C]' : 'text-purple-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Log Sheet</span>
          </button>
          {canAccessFacultyPortal && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
                activeTab === 'admin' ? 'bg-white/20 text-[#E5A93C]' : 'text-purple-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Admin' : 'Teacher'}</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
