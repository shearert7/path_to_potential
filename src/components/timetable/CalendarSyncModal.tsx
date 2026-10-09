import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TimetableBlock } from '../../types';
import { 
  syncTimetableToGoogleCalendar, 
  exportToIcsFile, 
  getCurrentWeekMonday, 
  getUpcomingMonday,
  CalendarSyncResult
} from '../../lib/googleCalendar';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  AlertCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimetableBlock[];
  weekType: 'A' | 'B';
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  blocks,
  weekType,
}) => {
  const { user, accessToken, signInWithGoogle } = useAuth();

  const [targetWeek, setTargetWeek] = useState<'current' | 'upcoming'>('upcoming');
  const [syncDuration, setSyncDuration] = useState<'singleWeek' | 'restOfYear'>('singleWeek');
  const [syncStudyOnly, setSyncStudyOnly] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<CalendarSyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentMonday = getCurrentWeekMonday();
  const upcomingMonday = getUpcomingMonday();
  const selectedMonday = targetWeek === 'upcoming' ? upcomingMonday : currentMonday;

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const blocksToSync = syncStudyOnly
    ? blocks.filter((b) => b.category === 'Study')
    : blocks;

  const handleSyncToGoogle = async () => {
    setErrorMsg('');
    setIsSyncing(true);

    try {
      let token = accessToken;

      // If no token cached in memory, prompt Google Sign-In with calendar scope
      if (!token) {
        token = await signInWithGoogle();
        if (!token) {
          setErrorMsg('Google authentication is required to access your Google Calendar.');
          setIsSyncing(false);
          return;
        }
      }

      const result = await syncTimetableToGoogleCalendar(
        token,
        blocks,
        selectedMonday,
        { 
          syncStudyOnly,
          repeatRestOfYear: syncDuration === 'restOfYear' 
        }
      );

      setSyncResult(result);
      if (!result.success && result.error) {
        setErrorMsg(result.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred while syncing with Google Calendar.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadIcs = () => {
    exportToIcsFile(blocksToSync, selectedMonday, {
      repeatRestOfYear: syncDuration === 'restOfYear'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4A154B] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#E5A93C]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Google Calendar Integration</h3>
              <p className="text-xs text-purple-200">
                Sync Week {weekType} timetable schedule to your Google Calendar
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {syncResult?.success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Timetable Synced Successfully!
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {syncDuration === 'restOfYear'
                    ? `Added ${syncResult.syncedCount} study events recurring weekly until the end of the year to your Google Calendar.`
                    : `Added ${syncResult.syncedCount} study events to your Google Calendar for the week of ${formatDate(selectedMonday)}.`}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#380e39] text-white text-xs font-bold shadow-md transition"
                >
                  <span>Open Google Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Target Week Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  1. Select Target Week in Calendar:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTargetWeek('upcoming')}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetWeek === 'upcoming'
                        ? 'border-[#4A154B] bg-purple-50/70 text-[#4A154B] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Upcoming Week</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Starts {formatDate(upcomingMonday)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetWeek('current')}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetWeek === 'current'
                        ? 'border-[#4A154B] bg-purple-50/70 text-[#4A154B] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Current Week</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Starts {formatDate(currentMonday)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Duration / Recurrence Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  2. Calendar Duration & Recurrence:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSyncDuration('singleWeek')}
                    className={`p-3 rounded-xl border text-left transition ${
                      syncDuration === 'singleWeek'
                        ? 'border-[#4A154B] bg-purple-50/70 text-[#4A154B] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">One Week Only</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Syncs only the selected 7 days
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyncDuration('restOfYear')}
                    className={`p-3 rounded-xl border text-left transition ${
                      syncDuration === 'restOfYear'
                        ? 'border-[#4A154B] bg-purple-50/70 text-[#4A154B] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Until Rest of the Year</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Repeats weekly through mid-December
                    </span>
                  </button>
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  3. Events to Synchronize:
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="syncScope"
                      checked={syncStudyOnly}
                      onChange={() => setSyncStudyOnly(true)}
                      className="text-[#4A154B] focus:ring-[#4A154B]"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Study Sessions Only (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Syncs {blocks.filter((b) => b.category === 'Study').length} independent study focus blocks.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="syncScope"
                      checked={!syncStudyOnly}
                      onChange={() => setSyncStudyOnly(false)}
                      className="text-[#4A154B] focus:ring-[#4A154B]"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Full Schedule (All {blocks.length} Blocks)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Syncs study sessions, school hours, sports training, and extracurriculars.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary Info */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  Events will be marked as <strong className="text-[#4A154B]">[Path to Potential]</strong> in your Google Calendar with gold color tags so you can easily identify study commitments.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  title="Download an .ics file for Apple Calendar or Outlook"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .ics File</span>
                </button>

                <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncToGoogle}
                    disabled={isSyncing || blocksToSync.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4A154B] to-[#691e6b] text-white text-xs font-bold shadow-md hover:from-[#3a0f3b] hover:to-[#551656] disabled:opacity-50 transition"
                  >
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {isSyncing
                        ? 'Syncing Events...'
                        : `Confirm & Sync ${blocksToSync.length} Events`}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
