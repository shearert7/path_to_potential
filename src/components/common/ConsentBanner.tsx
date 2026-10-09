import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Info } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'study_planner_data_consent';

export const ConsentBanner: React.FC = () => {
  const [hasConsented, setHasConsented] = useState<boolean>(true);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consent) {
      setHasConsented(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
    setHasConsented(true);
  };

  if (hasConsented) return null;

  return (
    <div className="bg-[#4A154B] text-white border-b-2 border-[#D4AF37] px-4 py-3 shadow-lg relative z-30 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#E5A93C] flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block sm:inline mr-2">
              Study Log Storage & Academic Access Notice:
            </span>
            <span className="text-purple-100">
              By using this Study Planner, you agree that your logged study hours, subjects, and timetable schedule will be securely stored and accessible to school academic coordinators and teachers to support your academic progress.
            </span>
          </div>
        </div>

        <button
          onClick={handleAccept}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5A93C] text-purple-950 font-extrabold text-xs shadow-md hover:brightness-105 transition flex-shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>I Understand & Accept</span>
        </button>
      </div>
    </div>
  );
};
