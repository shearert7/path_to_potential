import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { SECONDARY_SUBJECTS, getSubjectsForYear } from '../../constants/data';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  PlusCircle, 
  BookOpen, 
  FileText, 
  Flame, 
  Volume2, 
  VolumeX,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyTimerProps {
  onOpenManualModal: () => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ onOpenManualModal }) => {
  const { profile } = useAuth();
  const { addStudyLog, currentWeek, currentTerm } = useStudy();

  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    profile?.enrolledSubjects?.[0] || 'Mathematics'
  );
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');

  const timerRef = useRef<number | null>(null);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext fallback
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    if (secondsElapsed > 120) {
      if (!confirm('Are you sure you want to reset this timer session?')) return;
    }
    setIsActive(false);
    setSecondsElapsed(0);
  };

  const handleCompleteSession = async () => {
    if (secondsElapsed <= 0) {
      onOpenManualModal();
      return;
    }

    // Minimum 1 minute recorded for any active study session
    const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    setIsSaving(true);

    try {
      await addStudyLog({
        date: new Date().toISOString().split('T')[0],
        subject: selectedSubject,
        durationMinutes,
        weekNumber: currentWeek,
        termNumber: currentTerm,
        notes: sessionNotes.trim() || undefined,
      });

      playChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4A154B', '#D4AF37', '#E5A93C', '#22C55E']
      });

      const loggedMsg = `Successfully logged ${durationMinutes} min${durationMinutes > 1 ? 's' : ''} for ${selectedSubject}!`;
      setSuccessToast(loggedMsg);
      setTimeout(() => setSuccessToast(''), 4000);

      setIsActive(false);
      setSecondsElapsed(0);
      setSessionNotes('');
    } catch (err) {
      console.error('Failed to save study session:', err);
      alert('Could not save session. Please try again or use Manual Entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const yearSubjects = getSubjectsForYear(profile?.yearLevel);
  const enrolled = profile?.enrolledSubjects || [];
  const subjectOptions = Array.from(new Set([...enrolled.filter(s => yearSubjects.includes(s)), ...yearSubjects]));

  // Auto sync selected subject if outside allowed subjects for this year level
  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.includes(selectedSubject)) {
      setSelectedSubject(subjectOptions[0]);
    }
  }, [profile?.yearLevel, profile?.enrolledSubjects]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#4A154B] via-[#5c1a5e] to-[#4A154B] px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-white/10 text-amber-300">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Active Study Timer
              {isActive && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </h2>
            <p className="text-xs text-purple-200">
              Track focused, uninterrupted independent study for Year {profile?.yearLevel || 10}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition"
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenManualModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#E5A93C] border border-[#D4AF37]/50 text-xs font-semibold transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Success toast notification */}
        {successToast && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Stopwatch Display */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-50/70 rounded-xl border border-slate-100 mb-6">
          <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-wider text-[#4A154B] select-none">
            {formatTime(secondsElapsed)}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-2">
            <span>Subject: {selectedSubject}</span>
            <span>•</span>
            <span className="text-[#8e2491]">Target: {profile?.weeklyGoal || 15}h/week</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleStartPause}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#4A154B] hover:bg-[#380e39] text-white'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{secondsElapsed > 0 ? 'Resume Timer' : 'Start Focus Session'}</span>
                </>
              )}
            </button>

            {/* Finish & Log button - works immediately when clicked */}
            <button
              onClick={handleCompleteSession}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition transform active:scale-95 ${
                secondsElapsed > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title={secondsElapsed > 0 ? 'Save session to study log' : 'Open manual entry'}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Logging...' : 'Finish & Log'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={secondsElapsed === 0}
              className={`p-3 rounded-xl border border-slate-200 transition ${
                secondsElapsed > 0
                  ? 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#4A154B]" />
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A154B] focus:border-transparent transition"
            >
              {subjectOptions.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Session Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Session Focus & Notes (Optional)
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Chapter exercises, assignment drafting, revision questions"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A154B] focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex sm:hidden justify-center">
          <button
            onClick={onOpenManualModal}
            className="text-xs font-bold text-[#4A154B] hover:text-[#380e39] flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Or add manual past study entry
          </button>
        </div>
      </div>
    </div>
  );
};
